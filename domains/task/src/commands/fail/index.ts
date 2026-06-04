import { updateDbById } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory, TaskStatus } from '../../model';

import type { FailTaskCommandInput, FailTaskCommandResult } from './types';

const FAIL_INPUT_SCHEMA = z.object({
  taskId: z.string().min(1),
  errorMessage: z.string().min(1),
  errorCode: z.string().min(1),
});

const FAIL_DB_SCHEMA = z.object({
  status: z.literal(TaskStatus.Failed),
  errorMessage: z.string().min(1),
  errorCode: z.string().min(1),
  failedAt: z.date(),
});

const persistFail = updateDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
  validationSchema: FAIL_DB_SCHEMA,
});

export const fail = async ({
  taskId,
  errorMessage,
  errorCode,
}: FailTaskCommandInput): Promise<FailTaskCommandResult> => {
  const parsed = FAIL_INPUT_SCHEMA.safeParse({ taskId, errorMessage, errorCode });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  return persistFail({
    id: parsed.data.taskId,
    data: {
      status: TaskStatus.Failed,
      errorMessage: parsed.data.errorMessage,
      errorCode: parsed.data.errorCode,
      failedAt: new Date(),
    },
  });
};
