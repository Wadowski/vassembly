import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskQuestionsMongodbDao } from '../../clients';

import type { GetTaskQuestionsQueryInput, GetTaskQuestionsQueryResult } from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export const getTaskQuestions = async (
  input: GetTaskQuestionsQueryInput,
): Promise<GetTaskQuestionsQueryResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const data = await taskQuestionsMongodbDao.findByTaskId({ taskId: parsed.data.taskId });

  return { data };
};
