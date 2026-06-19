import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { TaskStatus } from '../../model';
import { conditionalStatusUpdate } from '../shared/conditionalStatusUpdate';

import type { FailTaskCommandInput, FailTaskCommandResult } from './types';

const FAIL_INPUT_SCHEMA = z.object({
  taskId: z.string().min(1),
  errorMessage: z.string().min(1),
  errorCode: z.string().min(1),
});

const NON_FAILABLE_STATUSES = [TaskStatus.Waiting, TaskStatus.Done, TaskStatus.Failed] as const;

export const fail = async ({
  taskId,
  errorMessage,
  errorCode,
}: FailTaskCommandInput): Promise<FailTaskCommandResult> => {
  const parsed = FAIL_INPUT_SCHEMA.safeParse({ taskId, errorMessage, errorCode });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  return conditionalStatusUpdate({
    taskId: parsed.data.taskId,
    filter: {
      status: { $nin: NON_FAILABLE_STATUSES },
    },
    update: {
      status: TaskStatus.Failed,
      errorMessage: parsed.data.errorMessage,
      errorCode: parsed.data.errorCode,
      failedAt: new Date(),
    },
    conflictCode: 'TASK_NOT_FAILABLE',
    conflictMessage: 'Task cannot be failed from its current status',
  });
};
