import { userMongodbDao } from "../clients";
import { UserModel, createUserFactory } from "../model";

interface GetByEmailParams {
  email: string;
  includePasswordHash?: boolean;
}

export const getByEmail = async ({
  email,
  includePasswordHash = false,
}: GetByEmailParams): Promise<UserModel | null> => {
  const userFactoryInstance = createUserFactory({ includePasswordHash });
  const [stored] = await userMongodbDao.getManyRaw(
    {
      email,
      removedAt: null,
    },
    { limit: 1 },
  );

  if (!stored) {
    return null;
  }

  return userFactoryInstance.create(stored);
};
