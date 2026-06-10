import { AUTH_TOKEN_ROLE } from '@vassembly/constants';

import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from '../constants';
import type { SeedContext } from '../fixtures/types';
import { applySeedContext } from './applySeedContext';
import { seedUser } from './seedUser';
import type { SeedUserResult } from './types';

export interface SeedAdminUserParams {
  context: SeedContext;
}

export const seedAdminUser = async ({ context }: SeedAdminUserParams): Promise<SeedUserResult> => {
  const user = await seedUser({
    email: E2E_ADMIN_EMAIL,
    password: E2E_ADMIN_PASSWORD,
    context,
  });

  applySeedContext({ context });
  const { mongoDb } = await import('@vassembly/client-mongodb');

  await mongoDb.db.collection('users').updateOne(
    { email: E2E_ADMIN_EMAIL },
    { $set: { role: AUTH_TOKEN_ROLE.ADMIN } },
  );

  const authTokenDomain = await import('@vassembly/domain-auth-token');
  const { randomUUID } = await import('node:crypto');

  const authToken = await authTokenDomain.default.commands.create({
    input: {
      role: AUTH_TOKEN_ROLE.ADMIN,
      userId: user.id,
      refreshTokenId: randomUUID(),
    },
  });

  const token = authToken.token ?? user.token;

  return { id: user.id, email: user.email, token };
};
