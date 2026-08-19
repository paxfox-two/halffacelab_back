export interface JwtPayload {
  sub: string; // user id, stringified (BigInt is not JSON/JWT safe)
  email: string | null;
}

export interface AuthenticatedUser {
  id: bigint;
  email: string | null;
}
