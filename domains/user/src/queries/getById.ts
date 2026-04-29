import { getDbById as getDbByIdHelper } from "@vassembly/queries";
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
  
  if (!includePasswordHash && result.data) {
    delete result.data.passwordHash;
  }
  
  return result;
};