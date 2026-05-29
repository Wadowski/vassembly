import { getListDbByQuery } from '@vassembly/queries';

import { taskMongodbDao } from '../../clients';
import { toTaskResponse } from '../../model';
import { taskFactory } from '../../model';

import type { TaskModel } from '../../model';
import type { GetByIdHandler, GetByIdInput } from './types';
import { assertGetByIdInput } from '../shared/assertGetByIdInput';

export type { GetByIdHandler, GetByIdInput } from './types';

const getModelByQuery = getListDbByQuery<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
});

export const getById: GetByIdHandler = async (input: GetByIdInput) => {
  assertGetByIdInput(input);

  const result = await getModelByQuery({ id: input.id, userId: input.userId, limit: 1, offset: 0 });

  if (!result.data || result.data.length === 0) {
    throw new Error('Task not found');
  }

  const task = result.data[0]!;

  return {
    data: toTaskResponse({ task }),
  };
};
