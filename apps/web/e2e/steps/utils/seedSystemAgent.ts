import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { ensureTaskDomainIndexes } from './seedTask';

export interface GetSystemAgentIdByNameParams {
  context: SeedContext;
  name: string;
}

export const getSystemAgentIdByName = async ({
  context,
  name,
}: GetSystemAgentIdByNameParams): Promise<string> => {
  await ensureTaskDomainIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  const existing = await systemAgentDomain.default.queries.getActiveByName({ name });
  const systemAgentId = existing.data.id;
  if (!systemAgentId) {
    throw new Error(`System agent "${name}" is missing an id`);
  }

  return systemAgentId;
};
