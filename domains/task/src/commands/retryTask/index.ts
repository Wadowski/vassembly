import { ConflictError, NotFoundError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskStatus } from '../../model';
import { getModelById } from '../../queries/getModelById';

import type { RetryTaskCommandInput, RetryTaskCommandResult } from './types';

const RETRY_INPUT_SCHEMA = z.object({
  taskId: z.string().min(1),
});

const RETRY_UPDATE = {
  status: TaskStatus.InProgress,
  errorMessage: null,
  errorCode: null,
  failedAt: null,
  pausedAt: null,
};

export const retryTask = async ({
  taskId,
}: RetryTaskCommandInput): Promise<RetryTaskCommandResult> => {
  const parsed = RETRY_INPUT_SCHEMA.safeParse({ taskId });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  let result = await taskMongodbDao.findOneAndUpdate({
    filter: { id: parsed.data.taskId, status: TaskStatus.Paused },
    update: RETRY_UPDATE,
  });

  if (!result) {
    result = await taskMongodbDao.findOneAndUpdate({
      filter: { id: parsed.data.taskId, status: TaskStatus.Failed },
      update: RETRY_UPDATE,
    });
  }

  if (result) {
    return { data: result };
  }

  try {
    await getModelById({ id: parsed.data.taskId });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    throw error;
  }

  throw new ConflictError('Task is not paused or failed', { code: 'TASK_NOT_RETRYABLE' });
};
