import { randomUUID } from 'node:crypto';

import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import { InternalError } from '@vassembly/errors';

import {
  E2E_DEFAULT_FIRST_NAME,
  E2E_DEFAULT_LAST_NAME,
} from '../constants';
import { applySeedContext } from './applySeedContext';
import type { SeedUserParams, SeedUserResult } from './types';

export const seedUser = async ({
  email,
  password,
  context,
}: SeedUserParams): Promise<SeedUserResult> => {
  applySeedContext({ context });

  const userDomain = await import('@vassembly/domain-user');
  const authTokenDomain = await import('@vassembly/domain-auth-token');

  const result = await userDomain.default.commands.create({
    email,
    password,
    firstName: E2E_DEFAULT_FIRST_NAME,
    lastName: E2E_DEFAULT_LAST_NAME,
  });

  const userId = result.data.id;
  if (!userId) {
    throw new InternalError('Seeded user is missing an id');
  }

  const authToken = await authTokenDomain.default.commands.create({
    input: {
      role: AUTH_TOKEN_ROLE.USER,
      userId,
      refreshTokenId: randomUUID(),
    },
  });

  const token = authToken.token;
  if (!token) {
    throw new InternalError('Seeded user auth token is missing');
  }

  return { id: userId, email, token };
};
