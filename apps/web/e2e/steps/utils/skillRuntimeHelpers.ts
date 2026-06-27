import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';
import { ConflictError } from '@vassembly/errors';

import { ensureDomainInfrastructure } from './initDomainContext';
import { ensureSkillIndexes } from './seedSkill';
import { ensureSystemAgentIndexes } from './seedSpecialization';

const E2E_SYSTEM_ADMIN_ID = 'e2e-system-admin';
export const SKILL_CATALOG_SECTION_HEADING = '## Available Skills';

export interface BuildSystemMessageForAgentInvokeParams {
  context: SeedContext;
  systemAgentId: string;
}

export interface InvokeResolveSkillParams {
  context: SeedContext;
  callerAgentId: string;
  specializationId: string;
  skillName: string;
}

export interface SeedRuntimeSystemAgentParams {
  context: SeedContext;
  name: string;
  specializationId?: string | null;
  assignedToolIds?: string[];
}

export const assignInternalToolsToSystemAgent = async ({
  context,
  systemAgentId,
  assignedToolIds,
}: {
  context: SeedContext;
  systemAgentId: string;
  assignedToolIds: string[];
}): Promise<void> => {
  await ensureDomainInfrastructure({ context });
  await ensureSystemAgentIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  const agentResult = await systemAgentDomain.default.queries.getActiveById({ id: systemAgentId });
  const existingToolIds = agentResult.data.assignedToolIds ?? [];
  const mergedToolIds = [...new Set([...existingToolIds, ...assignedToolIds])];

  await systemAgentDomain.default.commands.update({
    id: systemAgentId,
    updatedByAdminId: E2E_SYSTEM_ADMIN_ID,
    data: { assignedToolIds: mergedToolIds },
  });
};

export const seedRuntimeSystemAgent = async ({
  context,
  name,
  specializationId,
  assignedToolIds = [],
}: SeedRuntimeSystemAgentParams): Promise<string> => {
  await ensureDomainInfrastructure({ context });
  await ensureSystemAgentIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  try {
    const existing = await systemAgentDomain.default.queries.getActiveByName({ name });
    const existingId = existing.data.id;
    if (existingId) {
      if (assignedToolIds.length > 0) {
        await assignInternalToolsToSystemAgent({
          context,
          systemAgentId: existingId,
          assignedToolIds,
        });
      }

      return existingId;
    }
  } catch {
    // Agent does not exist yet — create below.
  }

  try {
    const created = await systemAgentDomain.default.commands.create({
      name,
      rule: `E2E runtime rule for ${name}.`,
      description: `E2E runtime agent ${name}`,
      category: 'utility',
      createdByAdminId: E2E_SYSTEM_ADMIN_ID,
      updatedByAdminId: E2E_SYSTEM_ADMIN_ID,
      assignedToolIds,
      specializationId: specializationId ?? undefined,
    });

    const createdId = created.data.id;

    if (!createdId) {
      throw new Error(`Failed to seed system agent "${name}"`);
    }

    return createdId;
  } catch (error) {
    if (error instanceof ConflictError) {
      const existing = await systemAgentDomain.default.queries.getActiveByName({ name });
      const existingId = existing.data.id;

      if (existingId) {
        return existingId;
      }
    }

    throw error;
  }
};

export const buildSystemMessageForSystemAgentInvoke = async ({
  context,
  systemAgentId,
}: BuildSystemMessageForAgentInvokeParams): Promise<string> => {
  await ensureDomainInfrastructure({ context });
  await ensureSkillIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });
  const skillDomain = requireWorkspaceModule<typeof import('@vassembly/domain-skill')>({
    moduleName: '@vassembly/domain-skill',
  });
  const { buildSystemAgentSystemMessage } = requireWorkspaceModule<
    typeof import('@vassembly/domain-system-agent/src/utils/buildSystemAgentSystemMessage/index.ts')
  >({
    moduleName: '@vassembly/domain-system-agent/src/utils/buildSystemAgentSystemMessage/index.ts',
  });

  const agentResult = await systemAgentDomain.default.queries.getActiveById({ id: systemAgentId });
  const agent = agentResult.data;

  if (!agent?.name || !agent.rule) {
    throw new Error(`System agent "${systemAgentId}" is missing name or rule.`);
  }

  let skillsCatalogSection: string | undefined;

  if (agent.specializationId) {
    const catalogResult = await skillDomain.default.queries.getCatalogBySpecializationId({
      specializationId: agent.specializationId,
    });
    const formatted = skillDomain.formatSkillsCatalogSection({ items: catalogResult.items });
    skillsCatalogSection = formatted.length > 0 ? formatted : undefined;
  }

  return buildSystemAgentSystemMessage({
    name: agent.name,
    rule: agent.rule,
    skillsCatalogSection,
  });
};

export const invokeResolveSkillTool = async ({
  context,
  callerAgentId,
  specializationId,
  skillName,
}: InvokeResolveSkillParams): Promise<string> => {
  await ensureDomainInfrastructure({ context });
  await ensureSkillIndexes({ context });

  const { createInternalToolHandlers } = requireWorkspaceModule<
    typeof import('@vassembly/service-agent/src/internalTools/createInternalToolHandlers.ts')
  >({
    moduleName: '@vassembly/service-agent/src/internalTools/createInternalToolHandlers.ts',
  });

  const handlers = createInternalToolHandlers({
    toolContext: {
      userId: 'e2e-runtime-user',
      taskId: 'e2e-runtime-task',
      invocationId: 'e2e-runtime-invocation',
      callerAgentId,
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'e2e-runtime-root',
    },
  });

  const resolveSkillHandler = handlers['skill-resolve'];
  if (!resolveSkillHandler) {
    throw new Error('skill-resolve internal tool handler is not registered.');
  }

  return resolveSkillHandler({ specializationId, skillName });
};
