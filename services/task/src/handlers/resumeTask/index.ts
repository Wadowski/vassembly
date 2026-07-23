import taskDomain, { TaskStatus, toTaskResponse } from '@vassembly/domain-task';
import taskProgressDomain from '@vassembly/domain-task-progress';
import { ConflictError, NotFoundError } from '@vassembly/errors';
import { logger } from '@vassembly/logger';

import { executeTask, TaskExecutionMode } from '../executeTask';
import { resolveActiveCommentId } from '../executeTask/resolveActiveCommentId';

import type { ResumeTaskHandlerInput, ResumeTaskHandlerOutput } from './types';

export const resumeTask = async ({
  userId,
  taskId,
}: ResumeTaskHandlerInput): Promise<ResumeTaskHandlerOutput> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (task.userId !== userId) {
    throw new NotFoundError('Task not found');
  }

  if (task.status === TaskStatus.InProgress) {
    return {
      task: toTaskResponse({ task }),
    };
  }

  if (task.status !== TaskStatus.Paused) {
    throw new ConflictError('Task is not paused', { code: 'TASK_NOT_RESUMABLE' });
  }

  const result = await taskDomain.commands.resumeTask({ taskId });
  const commentId = await resolveActiveCommentId({ taskId });

  void executeTask({
    taskId,
    userId,
    commentId,
    mode: TaskExecutionMode.Resume,
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
