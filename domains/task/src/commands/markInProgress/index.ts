import { updateDbById } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory, TaskStatus } from '../../model';

import type { MarkInProgressCommandInput, MarkInProgressCommandResult } from './types';

const MARK_IN_PROGRESS_INPUT_SCHEMA = z.object({
  taskId: z.string().min(1),
});

const MARK_IN_PROGRESS_DB_SCHEMA = z.object({
  status: z.literal(TaskStatus.InProgress),
  startedAt: z.date(),
});

const persistMarkInProgress = updateDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
  validationSchema: MARK_IN_PROGRESS_DB_SCHEMA,
});

export const markInProgress = async ({
  taskId,
}: MarkInProgressCommandInput): Promise<MarkInProgressCommandResult> => {
  const parsed = MARK_IN_PROGRESS_INPUT_SCHEMA.safeParse({ taskId });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  return persistMarkInProgress({
    id: parsed.data.taskId,
    data: {
      status: TaskStatus.InProgress,
      startedAt: new Date(),
    },
  });
};
