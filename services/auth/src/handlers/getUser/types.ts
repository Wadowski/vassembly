import type { UserPublicResponse } from '@vassembly/domain-user';

export interface GetUserInput {
  id: string;
}

export interface GetUserOutput {
  user: UserPublicResponse;
}
