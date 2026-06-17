import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskQuestionsMongodbDao } from '../../clients';

import type { DeleteByTaskIdCommandInput, DeleteByTaskIdCommandResult } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export const deleteByTaskId = async (
  input: DeleteByTaskIdCommandInput,
): Promise<DeleteByTaskIdCommandResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const deleted = await taskQuestionsMongodbDao.deleteByTaskId({ taskId: parsed.data.taskId });

  return { deleted };
};
