import { compareHash } from '@vassembly/client-encoder';
import { UnauthorizedError } from '@vassembly/errors';

import { toUserPublicResponse, type UserPublicResponse } from '../../model';
import { getByEmail } from '../getByEmail';

import type { VerifyCredentialsQuery } from './types';

export const verify = async ({
  email,
  password,
}: VerifyCredentialsQuery): Promise<UserPublicResponse> => {
  const user = await getByEmail({ email, includePasswordHash: true });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password', { email });
  }

  if (user.removedAt) {
    throw new UnauthorizedError('Invalid email or password', { email });
  }

  if (!user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password', { email });
  }

  const isPasswordValid = await compareHash({ text: password, hash: user.passwordHash });

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password', { email });
  }

  delete user.passwordHash;
  return toUserPublicResponse({ user });
};
