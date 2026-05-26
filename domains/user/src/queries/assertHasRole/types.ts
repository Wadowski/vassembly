import type { AUTH_TOKEN_ROLE } from '@vassembly/constants';

export interface AssertHasRoleParams {
  userId: string;
  role: AUTH_TOKEN_ROLE;
}
