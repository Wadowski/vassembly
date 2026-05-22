import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';

import type { CreateAgentHandlerInput } from './types';

export const createAgent = async (input: CreateAgentHandlerInput) => {
  const { body, userId } = input;
  const result = await agentDomain.commands.create({
    ...body,
    userId,
  });

  return { agent: toAgentResponse(result.data) };
};
