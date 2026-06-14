import { requireWorkspaceModule } from '@vassembly/e2e';

import { initDomainContext } from './initDomainContext';
import type { InitDomainContextParams } from './initDomainContext';

export interface SeedAgentParams extends InitDomainContextParams {
  userId: string;
  name: string;
  description?: string;
  rule?: string;
  integrationCredentialId?: string;
  assignedMcpIds?: string[];
}

export interface SoftDeleteAgentParams extends InitDomainContextParams {
  agentId: string;
  userId: string;
}

const DEFAULT_DESCRIPTION = 'E2E web agent description';
const DEFAULT_RULE = 'E2E web agent rule';

const ensureAgentIndexes = async ({ context }: InitDomainContextParams): Promise<void> => {
  initDomainContext({ context });

  const { init } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const agentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-agent')>({
    moduleName: '@vassembly/domain-agent',
  });

  await init({ indexFunctions: [agentDomain.default.mongodbIndexes] });
};

export const seedAgent = async ({
  context,
  userId,
  name,
  description = DEFAULT_DESCRIPTION,
  rule = DEFAULT_RULE,
  integrationCredentialId,
  assignedMcpIds,
}: SeedAgentParams): Promise<string> => {
  await ensureAgentIndexes({ context });

  const agentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-agent')>({
    moduleName: '@vassembly/domain-agent',
  });

  const result = await agentDomain.default.commands.create({
    userId,
    name,
    category: 'coding',
    description,
    rule,
    ...(integrationCredentialId !== undefined ? { integrationCredentialId } : {}),
    ...(assignedMcpIds !== undefined ? { assignedMcpIds } : {}),
  });

  const agentId = result.data.id;
  if (!agentId) {
    throw new Error('Seeded agent is missing an id');
  }

  return agentId;
};

export const softDeleteAgent = async ({
  context,
  agentId,
  userId,
}: SoftDeleteAgentParams): Promise<void> => {
  await ensureAgentIndexes({ context });

  const agentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-agent')>({
    moduleName: '@vassembly/domain-agent',
  });

  await agentDomain.default.commands.removeSoft({ id: agentId, userId });
};
