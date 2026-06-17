import taskDomain, { TaskStatus, toTaskResponse } from '@vassembly/domain-task';
import taskProgressDomain from '@vassembly/domain-task-progress';
import { ConflictError, NotFoundError } from '@vassembly/errors';
import { logger } from '@vassembly/logger';

import { executeTask, TaskExecutionMode } from '../executeTask';

import type { RetryTaskHandlerInput, RetryTaskHandlerOutput } from './types';

export const retryTask = async ({
  userId,
  taskId,
}: RetryTaskHandlerInput): Promise<RetryTaskHandlerOutput> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (task.userId !== userId) {
    throw new NotFoundError('Task not found');
  }

  if (task.status !== TaskStatus.Paused && task.status !== TaskStatus.Failed) {
    throw new ConflictError('Task is not paused or failed', { code: 'TASK_NOT_RETRYABLE' });
  }

  try {
    await taskProgressDomain.commands.resetTaskProgress({ taskId });
  } catch (error: unknown) {
    logger('task.retry.resetProgress.failed', {
      meta: { sessionId: 'TASK_EXECUTION', taskId, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  const result = await taskDomain.commands.retryTask({ taskId });

  void executeTask({
    taskId,
    userId,
    mode: TaskExecutionMode.Retry,
  }).catch((error: unknown) => {
    logger('task.execute.unhandled', {
      meta: { sessionId: 'TASK_EXECUTION', taskId, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  return {
    task: toTaskResponse({ task: result.data }),
  };
};
