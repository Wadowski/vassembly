import systemAgentDomain from '@vassembly/domain-system-agent';

import type { ListAgentRow } from './types';

export interface ListSystemAgentsBySpecializationIdsParams {
  specializationIds: string[];
}

const mapSystemAgentRow = (agent: {
  name: string;
  description?: string;
}): ListAgentRow => ({
  name: agent.name,
  description: agent.description,
  category: null,
  agentType: 'system',
});

export const listSystemAgentsBySpecializationIds = async ({
  specializationIds,
}: ListSystemAgentsBySpecializationIdsParams): Promise<ListAgentRow[]> => {
  const agentsById = new Map<string, ListAgentRow>();

  for (const specializationId of specializationIds) {
    const result = await systemAgentDomain.queries.getBySpecializationId({
      specializationId,
    });

    for (const agent of result.items) {
      if (agent.id === undefined || agent.name === undefined || agent.name === '') {
        continue;
      }

      if (agentsById.has(agent.id)) {
        continue;
      }

      agentsById.set(agent.id, mapSystemAgentRow(agent));
    }
  }

  return [...agentsById.values()].sort((left, right) => left.name.localeCompare(right.name));
};
