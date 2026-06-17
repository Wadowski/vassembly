import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskQuestionsMongodbDao } from '../../clients';

import type {
  ClearBlockedInvocationsCommandInput,
  ClearBlockedInvocationsCommandResult,
} from './types';

const VALIDATION_SCHEMA = z.object({
  taskId: z.string().min(1),
});

export const clearBlockedInvocations = async (
  input: ClearBlockedInvocationsCommandInput,
): Promise<ClearBlockedInvocationsCommandResult> => {
  const parsed = VALIDATION_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const data = await taskQuestionsMongodbDao.clearBlockedInvocations({
    taskId: parsed.data.taskId,
  });

  return { data };
};
