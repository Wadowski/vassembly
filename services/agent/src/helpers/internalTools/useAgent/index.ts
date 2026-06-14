import { MAX_USE_AGENT_DEPTH } from '@vassembly/constants';

import {
  buildUseAgentNotFoundError,
  USE_AGENT_DEPTH_ERROR,
} from '../constants';
import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';

import { resolveTarget } from './resolveTarget';

import type { UseAgentParams } from './types';

const resolveAgentName = (args: Record<string, unknown>): string | undefined => {
  const name = args.name;

  if (typeof name !== 'string') {
    return undefined;
  }

  const trimmed = name.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveAgentPrompt = (args: Record<string, unknown>): string | undefined => {
  const agentPrompt = args.agentPrompt;

  if (typeof agentPrompt !== 'string') {
    return undefined;
  }

  const trimmed = agentPrompt.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

export const useAgent = async ({ args, context }: UseAgentParams): Promise<string> => {
  if (context.recursionDepth >= MAX_USE_AGENT_DEPTH) {
    return USE_AGENT_DEPTH_ERROR;
  }

  const name = resolveAgentName(args);
  const agentPrompt = resolveAgentPrompt(args);

  if (!name) {
    return buildUseAgentNotFoundError({ name: '' });
  }

  if (!agentPrompt) {
    return buildUseAgentNotFoundError({ name });
  }

  const targetResult = await resolveTarget({ name, context });

  if ('error' in targetResult) {
    return targetResult.error;
  }

  const nestedResult = await runAgentInvokeWithTools({
    userId: context.userId,
    agentType: targetResult.agentType,
    agentId: targetResult.agentId,
    message: agentPrompt,
    connectionOverride: targetResult.connectionOverride,
    toolContext: {
      ...context,
      recursionDepth: context.recursionDepth + 1,
      callerAgentId: targetResult.agentId,
      callerAgentType: targetResult.agentType,
    },
  });

  return nestedResult.message;
};
