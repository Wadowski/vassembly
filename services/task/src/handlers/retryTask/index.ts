import taskDomain, { TaskStatus, toTaskResponse } from '@vassembly/domain-task';
import taskProgressDomain from '@vassembly/domain-task-progress';
import mcpUsageDomain from '@vassembly/domain-mcp-usage';
import internalToolUsageDomain from '@vassembly/domain-internal-tool-usage';
import { ConflictError, NotFoundError } from '@vassembly/errors';
import { logger } from '@vassembly/logger';

import { executeTask, TaskExecutionMode } from '../executeTask';
import { resolveActiveCommentId } from '../executeTask/resolveActiveCommentId';

import type { RetryTaskHandlerInput, RetryTaskHandlerOutput } from './types';

const resetCommentExecutionActivity = async ({ commentId }: { commentId: string }): Promise<void> => {
  await Promise.all([
    taskProgressDomain.commands.resetTaskProgress({ commentId }),
    mcpUsageDomain.commands.clearByCommentId({ commentId }),
    internalToolUsageDomain.commands.clearByCommentId({ commentId }),
  ]);
};

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

  const commentId = await resolveActiveCommentId({ taskId });

  try {
    await resetCommentExecutionActivity({ commentId });
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
    commentId,
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
