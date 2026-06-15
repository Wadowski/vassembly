import { UnauthorizedError } from '@vassembly/errors';

import { getModelById } from '../../queries';

import type { InvokeAgentParams, InvokeAgentResult, ModeledProviderInvokeParams } from './types';

const resolveInvokeParams = (
  params: InvokeAgentParams,
  agentRule: string | undefined,
): ModeledProviderInvokeParams => ({
  message: params.message,
  systemMessage: params.systemMessage ?? agentRule,
  mcpServerConfigs: params.mcpServerConfigs,
  internalToolBindings: params.internalToolBindings,
});

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
