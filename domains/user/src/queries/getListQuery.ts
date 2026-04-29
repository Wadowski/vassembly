import { getListDbByQuery as getListDbByQueryHelper } from "@vassembly/queries";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";
import z from "zod";

interface GetListByQueryParams {
  email?: string;
  limit?: number;
  offset?: number;
  includePasswordHash?: boolean;
}

const VALIDATION_SCHEMA = z.object({
  email: z.email().optional(),
});

const defaultGetListByQuery = getListDbByQueryHelper<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: VALIDATION_SCHEMA,
});

export const getListByQuery = async ({
  email,
  limit = 10,
  offset = 0,
  includePasswordHash = false,
}: GetListByQueryParams = {}): Promise<ReturnType<typeof defaultGetListByQuery>> => {
  const result = await defaultGetListByQuery({ email, limit, offset });
  
  if (!includePasswordHash && result.data) {
    result.data.forEach((user) => {
      delete user.passwordHash;
    });
  }
  
  return result;
};