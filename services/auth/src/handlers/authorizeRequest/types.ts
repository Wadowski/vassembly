export type AuthRole = "user" | "admin";

export interface AuthorizeRequestInput {
  headers: Record<string, string>;
}

export interface AuthorizeRequestOutput {
  userId: string;
  role?: AuthRole;
}
