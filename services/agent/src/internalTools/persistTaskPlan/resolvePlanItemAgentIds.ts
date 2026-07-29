import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

import { isSpecializationWorkerAgentName } from '../isSpecializationWorkerAgentName';

export interface ResolvePlanItemAgentIdsParams {
  items: Array<{ agentName: string }>;
  specializationIds: string[];
}

export interface ResolvedPlanItemAgent {
  agentName: string;
  agentId: string;
}

const normalizeAgentName = ({ name }: { name: string }): string => name.trim().toLowerCase();

const loadSpecializationAgents = async ({
  specializationIds,
}: {
  specializationIds: string[];
}): Promise<Array<{ id: string; name: string }>> => {
  const agentsById = new Map<string, { id: string; name: string }>();

  for (const specializationId of specializationIds) {
    const result = await systemAgentDomain.queries.getBySpecializationId({ specializationId });

    for (const agent of result.items) {
      if (agent.id === undefined || agent.name === undefined || agent.name === '') {
        continue;
      }

      if (agentsById.has(agent.id)) {
        continue;
      }

      agentsById.set(agent.id, { id: agent.id, name: agent.name });
    }
  }

  return [...agentsById.values()].sort((left, right) => left.name.localeCompare(right.name));
};

const resolveAgentIdByName = ({
  agentName,
  availableAgents,
}: {
  agentName: string;
  availableAgents: Array<{ id: string; name: string }>;
}): string => {
  const normalizedTarget = normalizeAgentName({ name: agentName });

  const exactMatches = availableAgents.filter(
    (agent) => normalizeAgentName({ name: agent.name }) === normalizedTarget,
  );

  if (exactMatches.length === 1) {
    return exactMatches[0]!.id;
  }

  if (exactMatches.length > 1) {
    throw new ValidationError(
      `Ambiguous agentName "${agentName}" — matches multiple agents: ${exactMatches.map((agent) => agent.name).join(', ')}`,
    );
  }

  const suffixMatches = availableAgents.filter((agent) =>
    normalizeAgentName({ name: agent.name }).endsWith(normalizedTarget),
  );

  if (suffixMatches.length === 1) {
    return suffixMatches[0]!.id;
  }

  const roleSuffixMatches = [' researcher', ' worker', ' validator'].flatMap((suffix) => {
    if (!normalizedTarget.endsWith(suffix.trim())) {
      return [];
    }

    return availableAgents.filter((agent) =>
      normalizeAgentName({ name: agent.name }).endsWith(suffix),
    );
  });

  if (roleSuffixMatches.length === 1) {
    return roleSuffixMatches[0]!.id;
  }

  const knownNames = availableAgents.map((agent) => agent.name).join(', ');

  throw new ValidationError(
    `Unknown agentName "${agentName}". Use an exact name from Available agents (e.g. ${knownNames || 'call list_agents first'})`,
  );
};

export const resolvePlanItemAgentIds = async ({
  items,
  specializationIds,
}: ResolvePlanItemAgentIdsParams): Promise<ResolvedPlanItemAgent[]> => {
  if (specializationIds.length === 0) {
    throw new ValidationError('specializationIds are required to resolve plan item agents');
  }

  const availableAgents = await loadSpecializationAgents({ specializationIds });
  const workerAgents = availableAgents.filter((agent) =>
    isSpecializationWorkerAgentName({ name: agent.name }),
  );

  if (workerAgents.length === 0) {
    throw new ValidationError('No specialization worker agents found for the current task');
  }

  return items.map((item) => {
    const agentId = resolveAgentIdByName({ agentName: item.agentName, availableAgents: workerAgents });
    const matchedAgent = workerAgents.find((agent) => agent.id === agentId);

    if (!matchedAgent) {
      throw new ValidationError(
        `Plan item agentName "${item.agentName}" must be a specialization worker from Available agents`,
      );
    }

    return {
      agentName: item.agentName,
      agentId,
    };
  });
};
