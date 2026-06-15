import agentDomain from '@vassembly/domain-agent';
import systemAgentDomain from '@vassembly/domain-system-agent';

export interface ResolveAgentDisplayNameParams {
  agentId: string;
  userId?: string;
}

export const resolveAgentDisplayName = async ({
  agentId,
  userId,
}: ResolveAgentDisplayNameParams): Promise<string | null> => {
  const systemAgentResult = await systemAgentDomain.queries.getActiveById({ id: agentId });

  if (systemAgentResult.data?.name) {
    return systemAgentResult.data.name;
  }

  if (userId) {
    try {
      const personalAgentResult = await agentDomain.queries.getById({ id: agentId, userId });

      if (personalAgentResult.data?.name) {
        return personalAgentResult.data.name;
      }
    } catch {
      return null;
    }
  }

  return null;
};

export interface ResolveAgentDisplayNamesParams {
  agentIds: string[];
  userId?: string;
}

export const resolveAgentDisplayNames = async ({
  agentIds,
  userId,
}: ResolveAgentDisplayNamesParams): Promise<Map<string, string>> => {
  const uniqueAgentIds = [...new Set(agentIds.filter((agentId) => agentId.length > 0))];
  const entries = await Promise.all(
    uniqueAgentIds.map(async (agentId) => {
      const name = await resolveAgentDisplayName({ agentId, userId });
      return [agentId, name] as const;
    }),
  );

  const nameMap = new Map<string, string>();

  for (const [agentId, name] of entries) {
    if (name) {
      nameMap.set(agentId, name);
    }
  }

  return nameMap;
};
