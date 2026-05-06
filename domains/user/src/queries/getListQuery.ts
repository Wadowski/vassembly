import { userMongodbDao } from "../clients";
import { UserModel, userFactory, createUserFactory } from "../model";
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

export const getListByQuery = async ({
  email,
  limit = 10,
  offset = 0,
  includePasswordHash = false,
}: GetListByQueryParams = {}): Promise<{ data: Array<UserModel> }> => {
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

  const userFactoryInstance = createUserFactory({ includePasswordHash });
  const data = daoResponse.map(
    (row) =>
      userFactoryInstance.toPublicResponse(row as UserModel) as UserModel,
  );

  return { data };
};
