import taskDomain, { type TaskResponse } from '@vassembly/domain-task';
import { ValidationError } from '@vassembly/errors';

import type { GetTaskHandlerInput } from './types';

export const getTask = async (input: GetTaskHandlerInput): Promise<TaskResponse> => {
  if (!input.userId) {
    throw new ValidationError('userId is required');
  }

  if (!input.taskId) {
    throw new ValidationError('taskId is required');
  }

  const result = await taskDomain.queries.getById({
    id: input.taskId,
    userId: input.userId,
  });

  return result.data;
};
