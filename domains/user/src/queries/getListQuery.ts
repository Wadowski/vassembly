import { userMongodbDao } from '../clients';
import { createUserFactory, toUserPublicResponse, userFactory } from '../model';
import z from 'zod';

import type { UserPublicResponse } from '../model';

export interface GetListByQueryParams {
  email?: string;
  limit?: number;
  offset?: number;
}

const VALIDATION_SCHEMA = z.object({
  email: z.email().optional(),
});

export const getListByQuery = async ({
  email,
  limit = 10,
  offset = 0,
}: GetListByQueryParams = {}): Promise<{ data: Array<UserPublicResponse> }> => {
  const queryInstance = userFactory.create({ email }, {
    validationSchema: VALIDATION_SCHEMA,
  });
  queryInstance.isValid({ shouldThrow: true });

  const match: Record<string, unknown> = {
    $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
  };
  if (email !== undefined) {
    match.email = email;
  }

  const daoResponse = await userMongodbDao.getManyRaw(match, { limit, offset });

  const userFactoryInstance = createUserFactory();
  const data = daoResponse.map((row) =>
    toUserPublicResponse({ user: userFactoryInstance.create(row) }),
  );

  return { data };
};
