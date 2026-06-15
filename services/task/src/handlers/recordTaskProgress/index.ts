import taskDomain from '@vassembly/domain-task';
import taskProgressDomain from '@vassembly/domain-task-progress';
import { ForbiddenError, NotFoundError, ValidationError } from '@vassembly/errors';

import type { RecordTaskProgressInput, RecordTaskProgressOutput } from './types';

export const recordTaskProgress = async (
  input: RecordTaskProgressInput
): Promise<RecordTaskProgressOutput> => {
  // Validate required fields
  if (!input.taskId) {
    throw new ValidationError('taskId is required');
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

  // 1. Verify task exists and belongs to user
  const taskResult = await taskDomain.queries.getModelById({ id: input.taskId });

  if (!taskResult.data) {
    throw new NotFoundError(`Task not found: ${input.taskId}`);
  }

  if (taskResult.data.userId !== input.userId) {
    throw new ForbiddenError('User does not have permission to record progress for this task');
  }

  // 2. Initialize task progress if it doesn't exist (idempotent)
  let taskProgressResult = await taskProgressDomain.queries.getModelByTaskId({
    taskId: input.taskId,
  });

  if (!taskProgressResult.data) {
    await taskProgressDomain.commands.initializeTaskProgress({
      taskId: input.taskId,
      userId: input.userId,
    });

    // Re-fetch to get the initialized progress
    taskProgressResult = await taskProgressDomain.queries.getModelByTaskId({
      taskId: input.taskId,
    });
  }

  // 3. Record the progress event
  const event = await taskProgressDomain.commands.recordProgressEvent({
    taskId: input.taskId,
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
