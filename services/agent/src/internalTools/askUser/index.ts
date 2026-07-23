import taskDomain from '@vassembly/domain-task';
import taskQuestionsDomain from '@vassembly/domain-task-questions';
import { ConflictError, ExecutionPausedError, UserInputWaitingError } from '@vassembly/errors';

import { captureResumeCheckpoint } from './captureResumeCheckpoint';
import { normalizeAskUserArgs } from './normalizeAskUserArgs';

import type { AskUserParams } from './types';

export const askUser = async ({ args, context }: AskUserParams): Promise<never> => {
  const {
    taskId,
    invocationId,
    callerAgentId,
    callerAgentType,
    abortSignal,
    shouldAbort,
  } = context;

  if (abortSignal?.aborted || (await shouldAbort?.())) {
    throw new ExecutionPausedError();
  }

  const normalized = normalizeAskUserArgs({ args });

  try {
    await taskQuestionsDomain.commands.recordQuestions({
      taskId,
      commentId: context.commentId,
      invocationId,
      askedByAgentId: callerAgentId,
      askedByAgentType: callerAgentType,
      questions: normalized.questions,
      resumeCheckpoint: captureResumeCheckpoint({ context }),
    });

    await taskDomain.commands.markWaiting({ taskId });
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new ExecutionPausedError();
    }

    throw error;
  }

  throw new UserInputWaitingError(
    `Waiting for user answers to ${normalized.questions.length} question(s)`,
  );
};
