import { appendCurrentDateTimeSection } from '@vassembly/constants';
import { UnauthorizedError } from '@vassembly/errors';

import { getModelById } from '../../queries';

import type { InvokeAgentParams, InvokeAgentResult, ModeledProviderInvokeParams } from './types';

const resolveInvokeParams = (
  params: InvokeAgentParams,
  agentRule: string | undefined,
): ModeledProviderInvokeParams => {
  const baseSystemMessage = params.systemMessage ?? agentRule ?? '';

  return {
    message: params.message,
    systemMessage: appendCurrentDateTimeSection({ systemMessage: baseSystemMessage }),
    mcpServerConfigs: params.mcpServerConfigs,
    internalToolBindings: params.internalToolBindings,
    signal: params.signal,
    shouldAbort: params.shouldAbort,
    recordMcpToolCall: params.recordMcpToolCall,
    recordInternalToolCall: params.recordInternalToolCall,
  };
};

export const invoke = async (params: InvokeAgentParams): Promise<InvokeAgentResult> => {
  const { modeledProviderClient, agentId, userId } = params;

  const { data: agent } = await getModelById({ id: agentId, userId });

  if (!agent) {
    throw new UnauthorizedError('Agent not found or access denied');
  }

  const invokeParams = resolveInvokeParams(params, agent.rule);
  const response = await modeledProviderClient.invoke(invokeParams);

  return {
    message: response.message,
    toolUsage: response.toolUsage,
    usage: response.usage,
  };
};
