import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { initDomainContext } from './initDomainContext';

export interface PromoteUserToAdminParams {
  context: SeedContext;
  email: string;
}

export const promoteUserToAdmin = async ({
  context,
  email,
}: PromoteUserToAdminParams): Promise<void> => {
  initDomainContext({ context });

  const { mongoDb } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });

  await mongoDb.db.collection('users').updateOne({ email }, { $set: { role: AUTH_TOKEN_ROLE.ADMIN } });
};
