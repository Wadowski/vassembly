import { updateDbById } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory, TaskStatus } from '../../model';

import type { MarkInProgressCommandInput, MarkInProgressCommandResult } from './types';

const MARK_IN_PROGRESS_INPUT_SCHEMA = z.object({
  taskId: z.string().min(1),
  activeCommentId: z.string().min(1).optional(),
});

const MARK_IN_PROGRESS_DB_SCHEMA = z.object({
  status: z.literal(TaskStatus.InProgress),
  startedAt: z.date(),
  activeCommentId: z.string().min(1).optional(),
});

const persistMarkInProgress = updateDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
  validationSchema: MARK_IN_PROGRESS_DB_SCHEMA,
});

export const markInProgress = async ({
  taskId,
  activeCommentId,
}: MarkInProgressCommandInput): Promise<MarkInProgressCommandResult> => {
  const parsed = MARK_IN_PROGRESS_INPUT_SCHEMA.safeParse({ taskId, activeCommentId });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  return persistMarkInProgress({
    id: parsed.data.taskId,
    data: {
      status: TaskStatus.InProgress,
      startedAt: new Date(),
      ...(parsed.data.activeCommentId !== undefined
        ? { activeCommentId: parsed.data.activeCommentId }
        : {}),
    },
  });
};
