import type { UserPublicResponse } from "@vassembly/domain-user";

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface ResetPasswordOutput {
  user: UserPublicResponse;
}
