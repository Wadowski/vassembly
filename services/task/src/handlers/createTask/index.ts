import taskDomain, { toTaskResponse } from '@vassembly/domain-task';

import type { CreateTaskHandlerInput, CreateTaskHandlerOutput } from './types';

export const createTask = async ({ userId, body }: CreateTaskHandlerInput): Promise<CreateTaskHandlerOutput> => {
  const result = await taskDomain.commands.create({
    userId,
    description: body.description,
  });

  return {
    task: toTaskResponse({ task: result.data }),
  };
};
