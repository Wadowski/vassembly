import taskDomain from '@vassembly/domain-task';
import { ValidationError } from '@vassembly/errors';

import type { ListUserTasksHandlerInput, ListUserTasksHandlerOutput } from './types';

export const listUserTasks = async (
  input: ListUserTasksHandlerInput,
): Promise<ListUserTasksHandlerOutput> => {
  if (!input.userId) {
    throw new ValidationError('userId is required');
  }

  return taskDomain.queries.listUserTasks({
    userId: input.userId,
    page: input.page,
    size: input.size,
    search: input.search,
  });
};
