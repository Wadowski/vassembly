import agentDomain from '@vassembly/domain-agent';

import type { GetAgentHandlerInput, GetAgentHandlerOutput } from './types';

export const getAgent = async (input: GetAgentHandlerInput): Promise<GetAgentHandlerOutput> => {
  const found = await agentDomain.queries.getById({
    id: input.agentId,
    userId: input.userId,
  });

  return { agent: found.data };
};
