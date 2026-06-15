import taskDomain from '@vassembly/domain-task';
import taskProgressDomain from '@vassembly/domain-task-progress';
import { NotFoundError, ForbiddenError } from '@vassembly/errors';

import type { RecordTaskProgressInput } from '../recordTaskProgress/types';

export const recordProgressEvent = async (
  input: RecordTaskProgressInput,
): Promise<void> => {
  const taskResult = await taskDomain.queries.getModelById({ id: input.taskId });

  if (!taskResult.data) {
    throw new NotFoundError(`Task not found: ${input.taskId}`);
  }

  if (taskResult.data.userId !== input.userId) {
    throw new ForbiddenError('User does not have permission to record progress for this task');
  }

  const taskProgressResult = await taskProgressDomain.queries.getModelByTaskId({
    taskId: input.taskId,
  });

  if (!taskProgressResult.data) {
    await taskProgressDomain.commands.initializeTaskProgress({
      taskId: input.taskId,
      userId: input.userId,
    });
  }

  await taskProgressDomain.commands.recordProgressEvent({
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
    integrationName: input.integrationName,
    provider: input.provider,
    model: input.model,
  });
};
