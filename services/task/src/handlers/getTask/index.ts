import taskDomain, { type TaskResponse } from '@vassembly/domain-task';

import type { GetTaskHandlerInput } from './types';

export const getTask = async (input: GetTaskHandlerInput): Promise<TaskResponse> => {
  const result = await taskDomain.queries.getById({
    id: input.taskId,
    userId: input.userId,
  });

  return result.data;
};
