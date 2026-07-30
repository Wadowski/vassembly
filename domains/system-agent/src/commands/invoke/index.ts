import { NotFoundError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

import { AgentStatus } from '../../constants';
import { getModelById } from '../../queries';
import { buildSystemAgentSystemMessage } from '../../utils/buildSystemAgentSystemMessage';

import { assertValidInput } from '../shared/assertValidInput';
import { INVOKE_SYSTEM_AGENT_SCHEMA } from '../shared/schemas';

import type { InvokeSystemAgentParams, InvokeSystemAgentResult } from './types';

const validateInvokeInput = validatorFactory(INVOKE_SYSTEM_AGENT_SCHEMA);

const NOT_FOUND_MESSAGE = 'System agent not found';

export const invoke = async (
  params: InvokeSystemAgentParams,
): Promise<InvokeSystemAgentResult> => {
  const validated = assertValidInput(
    validateInvokeInput({
      systemAgentId: params.systemAgentId,
      message: params.message,
    }),
  );

  const agentResult = await getModelById({ id: validated.systemAgentId });
  const agent = agentResult.data;

  if (
    agent.status !== AgentStatus.Active ||
    agent.removedAt != null ||
    agent.rule === undefined
  ) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  const response = await params.modeledProviderClient.invoke({
    message: validated.message,
    systemMessage: buildSystemAgentSystemMessage({
      name: agent.name!,
      rule: agent.rule,
      skillsCatalogSection: params.skillsCatalogSection,
      agentsCatalogSection: params.agentsCatalogSection,
      customInstructions: agent.customInstructions ?? undefined,
    }),
    mcpServerConfigs: params.mcpServerConfigs,
    internalToolBindings: params.internalToolBindings,
    signal: params.signal,
    shouldAbort: params.shouldAbort,
    recordMcpToolCall: params.recordMcpToolCall,
    recordInternalToolCall: params.recordInternalToolCall,
    requireSuccessfulToolLlmName: params.requireSuccessfulToolLlmName,
  });

  return {
    message: response.message,
    usage: response.usage,
    metadata: response.metadata,
    toolUsage: response.toolUsage,
  };
};
