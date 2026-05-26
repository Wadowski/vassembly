import { createDb } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { ZodError } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory, TaskStatus, TaskType } from '../../model';
import { sanitizeDescription } from '../shared/sanitizeDescription';

import type { CreateTaskCommandInput } from './types';

const createDbTask = createDb<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
});

export const create = async (
  input: CreateTaskCommandInput,
): Promise<{ data: TaskModel }> => {
  if (!input.userId) {
    throw new ValidationError('userId is required');
  }

  let description: string;
  try {
    description = sanitizeDescription(input.description);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.message);
    }
    throw error;
  }

  return createDbTask({
    userId: input.userId,
    description,
    type: TaskType.User,
    status: TaskStatus.Created,
    agentAssignedId: null,
  });
};
