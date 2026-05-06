import type { UserPublicResponse } from "@vassembly/domain-user";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: UserPublicResponse;
  authToken: string;
  refreshToken: string;
}
