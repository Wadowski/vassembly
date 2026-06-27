import { requireWorkspaceModule } from '@vassembly/e2e';

import { initDomainContext } from './initDomainContext';
import { ensureMcpIndexes, getMcpIdBySlug } from './seedMcp';
import type { InitDomainContextParams } from './initDomainContext';

const E2E_SYSTEM_ADMIN_ID = 'e2e-system-admin';
const AGENT_ROLES = ['researcher', 'worker', 'validator'] as const;
const DEFAULT_LINKED_MCP_SLUGS = ['brave-search-mcp', 'google-workspace-mcp'] as const;

export interface SeedSpecializationParams extends InitDomainContextParams {
  name: string;
  description: string;
}

export interface SeedSpecializationAgentsParams extends InitDomainContextParams {
  specializationId: string;
  specializationName: string;
  provisionedAgentCount: number;
}

export interface SeedSpecializationWithRelationsParams extends SeedSpecializationParams {
  agentCount: number;
  linkedMcpCount: number;
}

export interface SeedManySpecializationsParams extends InitDomainContextParams {
  count: number;
}

const normalizeSpecializationName = (name: string): string => name.trim().toLowerCase();

const toDisplayName = (name: string): string => {
  const normalized = normalizeSpecializationName(name);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const toAgentName = ({
  specializationName,
  role,
}: {
  specializationName: string;
  role: string;
}): string => `${toDisplayName(specializationName)} ${role}`;

const ensureSpecializationIndexes = async ({ context }: InitDomainContextParams): Promise<void> => {
  initDomainContext({ context });

  const { init } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const specializationDomain = requireWorkspaceModule<typeof import('@vassembly/domain-specialization')>({
    moduleName: '@vassembly/domain-specialization',
  });

  await init({ indexFunctions: [specializationDomain.default.mongodbIndexes] });
};

export const ensureSystemAgentIndexes = async ({ context }: InitDomainContextParams): Promise<void> => {
  initDomainContext({ context });

  const { init } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  await init({ indexFunctions: [systemAgentDomain.mongodbIndexes] });
};

export const seedSpecialization = async ({
  context,
  name,
  description,
}: SeedSpecializationParams): Promise<string> => {
  await ensureSpecializationIndexes({ context });

  const specializationDomain = requireWorkspaceModule<typeof import('@vassembly/domain-specialization')>({
    moduleName: '@vassembly/domain-specialization',
  });

  const result = await specializationDomain.default.commands.create({
    name: normalizeSpecializationName(name),
    description,
  });

  if (!result.id) {
    throw new Error(`Failed to seed specialization "${name}"`);
  }

  return result.id;
};

const seedSpecializationAgents = async ({
  context,
  specializationId,
  specializationName,
  provisionedAgentCount,
}: SeedSpecializationAgentsParams): Promise<void> => {
  await ensureSystemAgentIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  const rolesToCreate = AGENT_ROLES.slice(0, provisionedAgentCount);

  for (const role of rolesToCreate) {
    const agentName = toAgentName({ specializationName, role });

    try {
      const existing = await systemAgentDomain.default.queries.getActiveByName({ name: agentName });
      if (existing.data.id) {
        continue;
      }
    } catch {
      // Agent does not exist yet — create below.
    }

    await systemAgentDomain.default.commands.create({
      name: agentName,
      rule: `E2E ${role} rule for ${specializationName}`,
      description: `E2E ${role} agent`,
      category: 'utility',
      createdByAdminId: E2E_SYSTEM_ADMIN_ID,
      updatedByAdminId: E2E_SYSTEM_ADMIN_ID,
      assignedToolIds: [],
      specializationId,
    });
  }
};

const linkMcpsToSpecialization = async ({
  context,
  specializationId,
  linkedMcpCount,
}: {
  context: InitDomainContextParams['context'];
  specializationId: string;
  linkedMcpCount: number;
}): Promise<void> => {
  if (linkedMcpCount <= 0) {
    return;
  }

  await ensureMcpIndexes({ context });

  const mcpDomain = requireWorkspaceModule<typeof import('@vassembly/domain-mcp')>({
    moduleName: '@vassembly/domain-mcp',
  });

  const slugs = DEFAULT_LINKED_MCP_SLUGS.slice(0, linkedMcpCount);

  for (const slug of slugs) {
    const mcpId = await getMcpIdBySlug({ context, slug });
    await mcpDomain.default.commands.addSpecializationId({
      mcpId,
      specializationId,
    });
  }
};

export const seedSpecializationWithRelations = async ({
  context,
  name,
  description,
  agentCount,
  linkedMcpCount,
}: SeedSpecializationWithRelationsParams): Promise<string> => {
  const specializationId = await seedSpecialization({ context, name, description });

  await seedSpecializationAgents({
    context,
    specializationId,
    specializationName: name,
    provisionedAgentCount: agentCount,
  });

  await linkMcpsToSpecialization({ context, specializationId, linkedMcpCount });

  return specializationId;
};

export const seedManySpecializations = async ({
  context,
  count,
}: SeedManySpecializationsParams): Promise<void> => {
  for (let index = 0; index < count; index += 1) {
    const suffix = String(index + 1).padStart(2, '0');
    await seedSpecialization({
      context,
      name: `domain-${suffix}`,
      description: `E2E specialization ${suffix} for pagination testing.`,
    });
  }
};
