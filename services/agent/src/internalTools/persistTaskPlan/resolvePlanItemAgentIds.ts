import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

import { resolveSpecializationAgentRole } from '../createSpecialization/resolveSpecializationAgentRole';

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
  const specializationAgents = availableAgents.filter(
    (agent) => resolveSpecializationAgentRole({ name: agent.name }) !== undefined,
  );

  if (specializationAgents.length === 0) {
    throw new ValidationError(
      'No specialization agents (researcher, worker, or validator) found for the current task',
    );
  }

  return items.map((item) => {
    const agentId = resolveAgentIdByName({
      agentName: item.agentName,
      availableAgents: specializationAgents,
    });
    const matchedAgent = specializationAgents.find((agent) => agent.id === agentId);

    if (!matchedAgent) {
      throw new ValidationError(
        `Plan item agentName "${item.agentName}" must be a specialization agent (researcher, worker, or validator) from Available agents`,
      );
    }

    return {
      agentName: item.agentName,
      agentId,
    };
  });
};
