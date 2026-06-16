import { ConflictError, NotFoundError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { getModelById } from '../../queries/getModelById';

import type { TaskModel } from '../../model';

const TASK_ID_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export interface ConditionalStatusUpdateParams {
  taskId: string;
  filter: Partial<TaskModel>;
  update: Partial<TaskModel>;
  conflictCode: string;
  conflictMessage: string;
}

export interface ConditionalStatusUpdateResult {
  data: TaskModel;
}

export const conditionalStatusUpdate = async ({
  taskId,
  filter,
  update,
  conflictCode,
  conflictMessage,
}: ConditionalStatusUpdateParams): Promise<ConditionalStatusUpdateResult> => {
  const parsed = TASK_ID_SCHEMA.safeParse({ taskId });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const result = await taskMongodbDao.findOneAndUpdate({
    filter: { id: parsed.data.taskId, ...filter },
    update,
  });

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

  throw new ConflictError(conflictMessage, { code: conflictCode });
};
