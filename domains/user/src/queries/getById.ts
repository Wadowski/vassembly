import { NotFoundError } from '@vassembly/errors';

import { toUserPublicResponse } from '../model';

import { getModelById } from './getModelById';

import type { UserPublicResponse } from '../model';

export interface GetByIdParams {
  id: string;
}

export interface GetByIdResult {
  data: UserPublicResponse;
}

export const getById = async ({ id }: GetByIdParams): Promise<GetByIdResult> => {
  const result = await getModelById({ id });

  if (result.data.removedAt) {
    throw new NotFoundError(`User with id ${id} not found`);
  }

  return {
    data: toUserPublicResponse({ user: result.data }),
  };
};
