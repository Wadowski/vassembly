import taskDomain, { TaskStatus, toTaskResponse } from '@vassembly/domain-task';
import taskCommentDomain, { toTaskCommentResponse } from '@vassembly/domain-task-comment';
import taskProgressDomain from '@vassembly/domain-task-progress';
import { ConflictError, NotFoundError } from '@vassembly/errors';
import { logger } from '@vassembly/logger';

import { executeTask } from '../executeTask';

import type { SubmitTaskCommentHandlerInput, SubmitTaskCommentHandlerOutput } from './types';

const BLOCKED_STATUSES = new Set<TaskStatus>([TaskStatus.InProgress, TaskStatus.Paused]);

export const submitTaskComment = async ({
  userId,
  taskId,
  userText,
}: SubmitTaskCommentHandlerInput): Promise<SubmitTaskCommentHandlerOutput> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (!task || task.userId !== userId) {
    throw new NotFoundError('Task not found');
  }

  if (BLOCKED_STATUSES.has(task.status!)) {
    throw new ConflictError('Cannot submit a comment while the task is running', {
      code: 'TASK_COMMENT_NOT_ALLOWED',
    });
  }

  const commentResult = await taskCommentDomain.commands.create({
    taskId,
    userId,
    userText,
  });

  const commentId = commentResult.data.id!;

  await taskDomain.commands.markInProgress({ taskId, activeCommentId: commentId });

  await taskProgressDomain.commands.initializeTaskProgress({
    taskId,
    userId,
    commentId,
  });

  void executeTask({
    taskId,
    userId,
    commentId,
  }).catch((error: unknown) => {
    logger('task.execute.unhandled', {
      meta: { sessionId: 'TASK_EXECUTION', taskId, userId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
  });

  const refreshedTask = await taskDomain.queries.getModelById({ id: taskId });

  return {
    comment: toTaskCommentResponse({ taskComment: commentResult.data }),
    task: toTaskResponse({ task: refreshedTask.data! }),
  };
};
