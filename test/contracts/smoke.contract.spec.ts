describe("contract harness", () => {
  it("has a BASE_URL configured", () => {
    expect(process.env.BASE_URL).toBeDefined();
  });
});
