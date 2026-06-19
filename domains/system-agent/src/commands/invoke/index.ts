import { NotFoundError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

import { getActiveById } from '../../queries';
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

  const agentResult = await getActiveById({ id: validated.systemAgentId });

  if (agentResult.data === null || agentResult.data.rule === undefined) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  const response = await params.modeledProviderClient.invoke({
    message: validated.message,
    systemMessage: buildSystemAgentSystemMessage({
      name: agentResult.data.name!,
      rule: agentResult.data.rule,
    }),
    mcpServerConfigs: params.mcpServerConfigs,
    internalToolBindings: params.internalToolBindings,
    signal: params.signal,
    shouldAbort: params.shouldAbort,
  });

  return {
    message: response.message,
    usage: response.usage,
    metadata: response.metadata,
    toolUsage: response.toolUsage,
  };
};
