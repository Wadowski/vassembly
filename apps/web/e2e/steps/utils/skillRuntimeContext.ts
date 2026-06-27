import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { ensureDomainInfrastructure } from './initDomainContext';
import { ensureSystemAgentIndexes } from './seedSpecialization';

export const loadSystemAgentBaseRule = async ({
  context,
  systemAgentId,
}: {
  context: SeedContext;
  systemAgentId: string;
}): Promise<string> => {
  await ensureDomainInfrastructure({ context });
  await ensureSystemAgentIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  const agentResult = await systemAgentDomain.default.queries.getActiveById({ id: systemAgentId });
  const agent = agentResult.data;

  if (!agent?.name || !agent.rule) {
    throw new Error(`System agent "${systemAgentId}" is missing a name or rule.`);
  }

  const { buildSystemAgentSystemMessage } = requireWorkspaceModule<
    typeof import('@vassembly/domain-system-agent/src/utils/buildSystemAgentSystemMessage/index.ts')
  >({
    moduleName: '@vassembly/domain-system-agent/src/utils/buildSystemAgentSystemMessage/index.ts',
  });

  return buildSystemAgentSystemMessage({
    name: agent.name,
    rule: agent.rule,
  });
};

export const resolveSystemAgentIdFromWorld = ({
  world,
  agentName,
}: {
  world: import('./types').WebBddWorld;
  agentName: string;
}): string => {
  const resolvedName = agentName === 'Assistant' ? SYSTEM_AGENT_NAME.Assistant : agentName;
  const agentKey = resolvedName.trim().toLowerCase();
  const systemAgentId =
    world.storedFields?.[`systemAgentId:${agentKey}`] ?? world.systemAgentId;

  if (!systemAgentId) {
    throw new Error(`systemAgentId for "${agentName}" is required but not set on world.`);
  }

  return systemAgentId;
};

export const resolveSpecializationIdFromWorld = ({
  world,
  specializationName,
}: {
  world: import('./types').WebBddWorld;
  specializationName: string;
}): string => {
  const specializationKey = specializationName.trim().toLowerCase();
  const specializationId = world.specializationIds?.[specializationKey] ?? world.specializationId;

  if (!specializationId) {
    throw new Error(`specializationId for "${specializationName}" is required but not set on world.`);
  }

  return specializationId;
};
