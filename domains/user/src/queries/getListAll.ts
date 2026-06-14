import { getListDbByQuery as getListDbByQueryHelper } from "@vassembly/queries";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";

interface GetListAllParams {
  limit?: number;
  offset?: number;
  includePasswordHash?: boolean;
}

const defaultGetListAll = getListDbByQueryHelper<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});

export const getListAll = async ({
  limit = 10,
  offset = 0,
  includePasswordHash = false,
}: GetListAllParams = {}): Promise<ReturnType<typeof defaultGetListAll>> => {
  const result = await defaultGetListAll({ limit, offset });
  
  if (!includePasswordHash && result.data) {
    result.data.forEach((user) => {
      delete user.passwordHash;
    });
  }
  
  return result;
};