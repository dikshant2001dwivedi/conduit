import request from "supertest";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8000";

export const api = request(BASE_URL);

export function authHeader(token: string): string {
  try {
    const url = new URL(BASE_URL);
    const scheme = url.port === "3000" ? "Bearer" : "Token";
    return `${scheme} ${token}`;
  } catch {
    return `Token ${token}`;
  }
}

export function uniqueUserPayload() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    user: {
      email: `contract-${id}@example.com`,
      username: `contract_${id}`,
      password: "ContractPass123!"
    }
  };
}
