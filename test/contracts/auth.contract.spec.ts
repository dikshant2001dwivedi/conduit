import { api, authHeader, uniqueUserPayload } from "./helpers";

describe("Auth/User contracts", () => {
  it("POST /api/users registers a user with Django response shape", async () => {
    const payload = uniqueUserPayload();

    const response = await api.post("/api/users").send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toMatchObject({
      email: payload.user.email,
      username: payload.user.username
    });
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("POST /api/users returns 400 for invalid payload", async () => {
    const response = await api.post("/api/users").send({ user: {} });

    expect(response.status).toBe(400);
  });

  it("POST /api/users/login returns 202 and JWT token", async () => {
    const payload = uniqueUserPayload();
    await api.post("/api/users").send(payload);

    const response = await api.post("/api/users/login").send({
      user: {
        email: payload.user.email,
        password: payload.user.password
      }
    });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe(payload.user.email);
    expect(typeof response.body.user.token).toBe("string");
    expect(response.body.user.token.length).toBeGreaterThan(10);
  });

  it("POST /api/users/login returns 400 for invalid payload", async () => {
    const response = await api.post("/api/users/login").send({ user: {} });

    expect(response.status).toBe(400);
  });

  it("GET /api/user requires auth", async () => {
    const response = await api.get("/api/user");

    expect(response.status).toBe(401);
  });

  it("GET /api/user returns bare user object when authorized", async () => {
    const payload = uniqueUserPayload();
    await api.post("/api/users").send(payload);

    const login = await api.post("/api/users/login").send({
      user: {
        email: payload.user.email,
        password: payload.user.password
      }
    });

    const response = await api
      .get("/api/user")
      .set("Authorization", authHeader(login.body.user.token));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: payload.user.email,
      username: payload.user.username
    });
    expect(response.body).not.toHaveProperty("user");
    expect(response.body).not.toHaveProperty("password");
  });

  it("PUT /api/user updates and returns bare user object", async () => {
    const payload = uniqueUserPayload();
    await api.post("/api/users").send(payload);

    const login = await api.post("/api/users/login").send({
      user: {
        email: payload.user.email,
        password: payload.user.password
      }
    });

    const updateBody = {
      user: {
        email: `updated-${payload.user.email}`,
        bio: "Updated bio from contract",
        image: "http://example.com/updated-image.jpg"
      }
    };

    const response = await api
      .put("/api/user")
      .set("Authorization", authHeader(login.body.user.token))
      .send(updateBody);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: updateBody.user.email,
      bio: updateBody.user.bio,
      image: updateBody.user.image,
      username: payload.user.username
    });
    expect(response.body).not.toHaveProperty("user");
  });
});
