import { randomUUID } from 'node:crypto';

import { MAX_USE_AGENT_DEPTH } from '@vassembly/constants';
import type { AnsweredQuestion } from '@vassembly/domain-task-questions';
import { ExecutionPausedError, UserInputWaitingError } from '@vassembly/errors';

import { invocationResumeRegistry } from '../../invocationResumeRegistry';
import {
  buildUseAgentNotFoundError,
  USE_AGENT_DEPTH_ERROR,
} from '../constants';
import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';

import { resolveTarget } from './resolveTarget';
import { buildChildResumeMessage } from './buildChildResumeMessage';

import type { UseAgentParams } from './types';
import type { ResolveTargetResult } from './types';

export { buildChildResumeMessage } from './buildChildResumeMessage';
export type { BuildChildResumeMessageParams } from './buildChildResumeMessage';

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

const runChildInvocation = async ({
  context,
  childInvocationId,
  targetResult,
  message,
}: {
  context: UseAgentParams['context'];
  childInvocationId: string;
  targetResult: Extract<ResolveTargetResult, { agentId: string }>;
  message: string;
}): Promise<string> => {
  const nestedResult = await runAgentInvokeWithTools({
    userId: context.userId,
    agentType: targetResult.agentType,
    agentId: targetResult.agentId,
    message,
    connectionOverride: targetResult.connectionOverride,
    toolContext: {
      ...context,
      invocationId: childInvocationId,
      parentInvocationId: context.invocationId,
      recursionDepth: context.recursionDepth + 1,
      parentAgentId: context.callerAgentId,
      callerAgentId: targetResult.agentId,
      callerAgentType: targetResult.agentType,
    },
  });

  return nestedResult.message;
};

export const useAgent = async ({ args, context }: UseAgentParams): Promise<string> => {
  if (context.abortSignal?.aborted) {
    throw new ExecutionPausedError();
  }

  if (context.shouldAbort && (await context.shouldAbort())) {
    throw new ExecutionPausedError();
  }

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

  const childInvocationId = randomUUID();

  const completeChild = async (message: string): Promise<string> =>
    runChildInvocation({
      context,
      childInvocationId,
      targetResult,
      message,
    });

  try {
    return await completeChild(agentPrompt);
  } catch (error) {
    if (error instanceof UserInputWaitingError) {
      return invocationResumeRegistry.waitForCompletion({
        taskId: context.taskId,
        invocationId: childInvocationId,
        resume: async ({ answeredQuestions }) =>
          completeChild(buildChildResumeMessage({ agentPrompt, answeredQuestions })),
      });
    }

    throw error;
  }
};
