export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  username: string;
}