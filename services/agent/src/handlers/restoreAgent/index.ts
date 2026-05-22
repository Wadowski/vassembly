import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';
import { WrongParamError } from '@vassembly/errors';

import type { RestoreAgentHandlerInput, RestoreAgentHandlerOutput } from './types';

export const restoreAgent = async (input: RestoreAgentHandlerInput): Promise<RestoreAgentHandlerOutput> => {
  const existing = await agentDomain.queries.getById({
    id: input.agentId,
    userId: input.userId,
  });

  if (!existing.data.removedAt) {
    throw new WrongParamError('Agent not deleted');
  }

  const restored = await agentDomain.commands.restore({
    id: input.agentId,
    userId: input.userId,
  });

  return { agent: toAgentResponse(restored.data) };
};
