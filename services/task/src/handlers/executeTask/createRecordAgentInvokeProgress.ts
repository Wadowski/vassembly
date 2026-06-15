import { recordProgressEvent } from './recordProgressHelper';

import type { AgentInvokeProgressEventInput } from '@vassembly/service-agent';
import type { CreateRecordAgentInvokeProgressParams } from './types';

export const createRecordAgentInvokeProgress = ({
  taskId,
  userId,
}: CreateRecordAgentInvokeProgressParams) => {
  return async (input: AgentInvokeProgressEventInput): Promise<void> => {
    await recordProgressEvent({
      taskId,
      userId,
      agentId: input.agentId,
      parentAgentId: input.parentAgentId,
      state: input.state,
      timestamp: input.timestamp,
      duration: input.duration,
      inputMessages: input.inputMessages,
      generatedResponse: input.generatedResponse,
      tokenUsage: input.tokenUsage,
      errorDetails: input.errorDetails,
      integrationName: input.integrationName,
      provider: input.provider,
      model: input.model,
    });
  };
};
