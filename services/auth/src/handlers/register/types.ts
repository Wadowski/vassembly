import type { UserPublicResponse } from "@vassembly/domain-user";

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterOutput {
  user: UserPublicResponse;
}
