import { api, authHeader, uniqueUserPayload } from "./helpers";

type ArticleRecord = Record<string, unknown>;

function randomArticlePayload() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    article: {
      title: `Contract Article ${id}`,
      description: `Description ${id}`,
      body: `Body ${id}`,
      tagList: ["contract", `tag-${id}`]
    }
  };
}

function extractArticle(body: unknown): ArticleRecord {
  if (body && typeof body === "object" && "article" in body) {
    return (body as { article: ArticleRecord }).article;
  }

  return body as ArticleRecord;
}

async function registerAndLogin() {
  const payload = uniqueUserPayload();
  await api.post("/api/users").send(payload);

  const login = await api.post("/api/users/login").send({
    user: {
      email: payload.user.email,
      password: payload.user.password
    }
  });

  return {
    user: payload.user,
    token: login.body.user.token as string
  };
}

async function createArticle(token: string, payload = randomArticlePayload()) {
  const response = await api
    .post("/api/articles")
    .set("Authorization", authHeader(token))
    .send(payload);

  return {
    response,
    article: extractArticle(response.body)
  };
}

describe("Articles contracts", () => {
  it("GET /api/articles returns a list payload", async () => {
    const response = await api.get("/api/articles");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("POST /api/articles requires auth", async () => {
    const response = await api.post("/api/articles").send(randomArticlePayload());

    expect(response.status).toBe(401);
  });

  it("POST /api/articles creates article for authorized user", async () => {
    const actor = await registerAndLogin();
    const payload = randomArticlePayload();

    const response = await api
      .post("/api/articles")
      .set("Authorization", authHeader(actor.token))
      .send(payload);

    const article = extractArticle(response.body);

    expect(response.status).toBe(201);
    expect(article.title).toBe(payload.article.title);
    expect(typeof article.slug).toBe("string");
  });

  it("BUG-001: GET /api/articles/feed returns comments + articleCount keys", async () => {
    const author = await registerAndLogin();
    const follower = await registerAndLogin();

    await api
      .post(`/api/profiles/${author.user.username}/follow`)
      .set("Authorization", authHeader(follower.token));

    await createArticle(author.token);

    const response = await api
      .get("/api/articles/feed")
      .set("Authorization", authHeader(follower.token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.comments)).toBe(true);
    expect(typeof response.body.articleCount).toBe("number");
    expect(response.body.articles).toBeUndefined();
  });

  it("BUG-002: PUT /api/articles/:slug keeps updatedAt frozen", async () => {
    const actor = await registerAndLogin();
    const created = await createArticle(actor.token);
    const slug = created.article.slug as string;
    const createdUpdatedAt =
      (created.article.updatedAt as string | undefined) ??
      (created.article.updated as string | undefined);

    expect(typeof slug).toBe("string");
    expect(typeof createdUpdatedAt).toBe("string");

    const updateResponse = await api
      .put(`/api/articles/${slug}`)
      .set("Authorization", authHeader(actor.token))
      .send({
        article: {
          title: created.article.title,
          description: "Updated description via contract test",
          body: created.article.body,
          tagList: created.article.tagList
        }
      });

    const updated = extractArticle(updateResponse.body);
    const updatedUpdatedAt =
      (updated.updatedAt as string | undefined) ??
      (updated.updated as string | undefined);

    expect(updateResponse.status).toBe(200);
    expect(updated.description).toBe("Updated description via contract test");
    expect(updatedUpdatedAt).toBe(createdUpdatedAt);
  });
});