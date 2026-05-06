import { getDbById as getDbByIdHelper } from "@vassembly/queries";
import { NotFoundError } from "@vassembly/errors";

import { userMongodbDao } from "../clients";
import { UserModel, userFactory, createUserFactory } from "../model";

interface GetByIdParams {
  id: string;
  includePasswordHash?: boolean;
}

const defaultGetById = getDbByIdHelper<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});

export const getById = async ({
  id,
  includePasswordHash = false,
}: GetByIdParams): Promise<ReturnType<typeof defaultGetById>> => {
  const result = await defaultGetById({ id });

  if (result.data?.removedAt) {
    throw new NotFoundError(`User with id ${id} not found`);
  }

  if (result.data) {
    const userFactoryInstance = createUserFactory({ includePasswordHash });
    result.data = userFactoryInstance.toPublicResponse(result.data) as UserModel;
  }

  return result;
};
