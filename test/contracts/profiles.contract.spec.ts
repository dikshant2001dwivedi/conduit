import { api, authHeader, uniqueUserPayload } from "./helpers";

function extractProfileBody(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object" && "profile" in body) {
    return (body as { profile: Record<string, unknown> }).profile;
  }

  return body as Record<string, unknown>;
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
    token: login.body.user.token as string,
    user: payload.user
  };
}

describe("Profile contracts", () => {
  it("GET /api/profiles/:username requires auth", async () => {
    const target = uniqueUserPayload();
    await api.post("/api/users").send(target);

    const response = await api.get(`/api/profiles/${target.user.username}`);

    expect(response.status).toBe(401);
  });

  it("GET /api/profiles/:username returns profile envelope when authorized", async () => {
    const actor = await registerAndLogin();
    const target = uniqueUserPayload();
    await api.post("/api/users").send(target);

    const response = await api
      .get(`/api/profiles/${target.user.username}`)
      .set("Authorization", authHeader(actor.token));

    const profile = extractProfileBody(response.body);

    expect(response.status).toBe(200);
    expect(profile).toMatchObject({
      username: target.user.username,
      following: false
    });
  });

  it("POST /api/profiles/:username/follow requires auth", async () => {
    const target = uniqueUserPayload();
    await api.post("/api/users").send(target);

    const response = await api.post(
      `/api/profiles/${target.user.username}/follow`
    );

    expect(response.status).toBe(401);
  });

  it("POST /api/profiles/:username/follow sets following=true", async () => {
    const actor = await registerAndLogin();
    const target = uniqueUserPayload();
    await api.post("/api/users").send(target);

    const response = await api
      .post(`/api/profiles/${target.user.username}/follow`)
      .set("Authorization", authHeader(actor.token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("profile");
    expect(response.body.profile).toMatchObject({
      username: target.user.username,
      following: true
    });
  });

  it("DELETE /api/profiles/:username/follow sets following=false", async () => {
    const actor = await registerAndLogin();
    const target = uniqueUserPayload();
    await api.post("/api/users").send(target);

    await api
      .post(`/api/profiles/${target.user.username}/follow`)
      .set("Authorization", authHeader(actor.token));

    const response = await api
      .delete(`/api/profiles/${target.user.username}/follow`)
      .set("Authorization", authHeader(actor.token));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("profile");
    expect(response.body.profile).toMatchObject({
      username: target.user.username,
      following: false
    });
  });
});