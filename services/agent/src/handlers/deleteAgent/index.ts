import agentDomain from '@vassembly/domain-agent';

import type { DeleteAgentHandlerInput, DeleteAgentHandlerOutput } from './types';

export const deleteAgent = async (input: DeleteAgentHandlerInput): Promise<DeleteAgentHandlerOutput> => {
  await agentDomain.commands.removeSoft({
    id: input.agentId,
    userId: input.userId,
  });
  return { success: true, message: 'Agent deleted' };
};
