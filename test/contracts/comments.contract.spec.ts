import { api, authHeader, uniqueUserPayload } from "./helpers";

type CommentRecord = Record<string, unknown>;

function randomArticlePayload() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    article: {
      title: `Comment Article ${id}`,
      description: `Description ${id}`,
      body: `Body ${id}`,
      tagList: ["contract", "comments"]
    }
  };
}

function extractArticle(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object" && "article" in body) {
    return (body as { article: Record<string, unknown> }).article;
  }

  return body as Record<string, unknown>;
}

function extractComment(body: unknown): CommentRecord {
  if (body && typeof body === "object" && "comment" in body) {
    return (body as { comment: CommentRecord }).comment;
  }

  return body as CommentRecord;
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

async function createArticle(token: string) {
  const response = await api
    .post("/api/articles")
    .set("Authorization", authHeader(token))
    .send(randomArticlePayload());

  const article = extractArticle(response.body);

  return article.slug as string;
}

describe("Comments contracts", () => {
  it("GET /api/articles/:slug/comments returns comments list", async () => {
    const actor = await registerAndLogin();
    const slug = await createArticle(actor.token);

    const response = await api.get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.comments)).toBe(true);
  });

  it("POST /api/articles/:slug/comments requires auth", async () => {
    const actor = await registerAndLogin();
    const slug = await createArticle(actor.token);

    const response = await api
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: "Unauth comment" } });

    expect(response.status).toBe(401);
  });

  it("POST /api/articles/:slug/comments creates comment and returns status 200", async () => {
    const actor = await registerAndLogin();
    const slug = await createArticle(actor.token);
    const body = "Created by contract test";

    const response = await api
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", authHeader(actor.token))
      .send({ comment: { body } });

    const comment = extractComment(response.body);

    expect(response.status).toBe(200);
    expect(comment.body).toBe(body);
    expect(typeof comment.id).toBe("number");
  });

  it("DELETE /api/articles/:slug/comments/:id deletes author comment", async () => {
    const actor = await registerAndLogin();
    const slug = await createArticle(actor.token);

    const create = await api
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", authHeader(actor.token))
      .send({ comment: { body: "To be deleted" } });

    const comment = extractComment(create.body);

    const response = await api
      .delete(`/api/articles/${slug}/comments/${comment.id}`)
      .set("Authorization", authHeader(actor.token));

    expect(response.status).toBe(204);
  });
});