import { randomUUID } from 'node:crypto';

import { runAgentInvokeWithTools } from '../../internalTools/runAgentInvokeWithTools';

import type { InvokePersonalAgentParams, InvokePersonalAgentResult } from './types';

export const invokePersonalAgent = async (
  input: InvokePersonalAgentParams,
): Promise<InvokePersonalAgentResult> => {
  const { userId, agentId, message } = input;

  const result = await runAgentInvokeWithTools({
    userId,
    agentType: 'personal',
    agentId,
    message,
    toolContext: {
      userId,
      taskId: '',
      commentId: '',
      invocationId: randomUUID(),
      callerAgentId: agentId,
      callerAgentType: 'personal',
      recursionDepth: 0,
      rootInvokeId: randomUUID(),
    },
  });

  return {
    message: result.message,
    metadata: {
      mcpIdsUsed: result.metadata.mcpIdsUsed,
      skippedMcpIds: result.metadata.skippedMcpIds,
      internalToolIdsUsed: result.metadata.internalToolIdsUsed,
      skippedInternalToolIds: result.metadata.skippedInternalToolIds,
      maxUseAgentDepth: result.metadata.maxUseAgentDepth,
    },
  };
};
