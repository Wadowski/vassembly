import { NotFoundError } from '@vassembly/errors';
import { getListDbByQuery } from '@vassembly/queries';

import { taskCommentMongodbDao } from '../../clients';
import { toTaskCommentResponse, taskCommentFactory } from '../../model';

import type { TaskCommentModel } from '../../model';
import type { GetByIdHandler, GetByIdInput } from './types';

export type { GetByIdHandler, GetByIdInput } from './types';

const getModelByQuery = getListDbByQuery<TaskCommentModel>({
  dao: taskCommentMongodbDao,
  factory: taskCommentFactory,
});

export const getById: GetByIdHandler = async (input: GetByIdInput) => {
  const result = await getModelByQuery({
    id: input.id,
    userId: input.userId,
    limit: 1,
    offset: 0,
  });

  if (!result.data || result.data.length === 0) {
    throw new NotFoundError('Task comment not found');
  }

  const taskComment = result.data[0]!;

  return {
    data: toTaskCommentResponse({ taskComment }),
  };
};
