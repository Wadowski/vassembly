import type { AuthUser } from '@vassembly/ui-user-auth';
import type { RegisterCompletionUser } from './types';

export const mapRegisterUserToAuthUser = (user: RegisterCompletionUser): AuthUser => {
  const { id, email } = user;
  return { id, email };
};
