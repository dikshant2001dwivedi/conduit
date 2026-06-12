import { api } from "./helpers";

describe("Tags contracts", () => {
  it("GET /api/tags returns tags array", async () => {
    const response = await api.get("/api/tags");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.tags)).toBe(true);
  });
});