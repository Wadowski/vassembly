import agentDomain from '@vassembly/domain-agent';

import type { ListAgentsHandlerInput, ListAgentsHandlerOutput } from './types';

export const listAgents = async (input: ListAgentsHandlerInput): Promise<ListAgentsHandlerOutput> => {
  const result = await agentDomain.queries.getListForUser({
    userId: input.userId,
    page: input.page,
    size: input.size,
    search: input.search,
    status: input.status,
  });

  return result;
};
