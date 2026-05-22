import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';
import { InternalError, WrongParamError } from '@vassembly/errors';

import type { UpdateAgentHandlerInput, UpdateAgentHandlerOutput } from './types';

export const updateAgent = async (input: UpdateAgentHandlerInput): Promise<UpdateAgentHandlerOutput> => {
  const existing = await agentDomain.queries.getById({
    id: input.agentId,
    userId: input.userId,
  });

  if (existing.data.removedAt) {
    throw new WrongParamError('Agent has been deleted; restore before updating.');
  }

  const updated = await agentDomain.commands.update({
    id: input.agentId,
    data: input.patch,
  });

  if (!updated.data) {
    throw new InternalError('Agent update produced no persisted row');
  }

  return { agent: toAgentResponse(updated.data) };
};
