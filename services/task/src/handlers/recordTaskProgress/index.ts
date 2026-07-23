import taskDomain from '@vassembly/domain-task';
import taskProgressDomain from '@vassembly/domain-task-progress';
import { ForbiddenError, NotFoundError, ValidationError } from '@vassembly/errors';

import type { RecordTaskProgressInput, RecordTaskProgressOutput } from './types';

export const recordTaskProgress = async (
  input: RecordTaskProgressInput
): Promise<RecordTaskProgressOutput> => {
  if (!input.taskId) {
    throw new ValidationError('taskId is required');
  }
  if (!input.commentId) {
    throw new ValidationError('commentId is required');
  }
  if (!input.userId) {
    throw new ValidationError('userId is required');
  }
  if (!input.agentId) {
    throw new ValidationError('agentId is required');
  }
  if (!input.state) {
    throw new ValidationError('state is required');
  }

  const taskResult = await taskDomain.queries.getModelById({ id: input.taskId });

  if (!taskResult.data) {
    throw new NotFoundError(`Task not found: ${input.taskId}`);
  }

  if (taskResult.data.userId !== input.userId) {
    throw new ForbiddenError('User does not have permission to record progress for this task');
  }

  let taskProgressResult = await taskProgressDomain.queries.getModelByCommentId({
    commentId: input.commentId,
  });

  if (!taskProgressResult.data) {
    await taskProgressDomain.commands.initializeTaskProgress({
      taskId: input.taskId,
      userId: input.userId,
      commentId: input.commentId,
    });

    taskProgressResult = await taskProgressDomain.queries.getModelByCommentId({
      commentId: input.commentId,
    });
  }

  const event = await taskProgressDomain.commands.recordProgressEvent({
    commentId: input.commentId,
    agentId: input.agentId,
    parentAgentId: input.parentAgentId,
    state: input.state,
    timestamp: input.timestamp || new Date(),
    duration: input.duration,
    inputMessages: input.inputMessages,
    generatedResponse: input.generatedResponse,
    tokenUsage: input.tokenUsage,
    errorDetails: input.errorDetails,
  });

  return event;
};
