import type { Model } from "@vassembly/model";
import type { GetListDbByQueryHandler, GetListDbByQueryGeneratorParams } from "./types";

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;

export const getListDbByQuery = <T extends Model>({ 
  factory, 
  dao, 
  validationSchema,
  defaultLimit = DEFAULT_LIMIT,
  defaultOffset = DEFAULT_OFFSET,
}: GetListDbByQueryGeneratorParams<T>): GetListDbByQueryHandler<T> => async ({ 
  limit = defaultLimit, 
  offset = defaultOffset, 
  ...query
}) => {
  const queryInstance = factory.create(query as Partial<T>, { validationSchema });

  if (validationSchema) {
    queryInstance.isValid({ shouldThrow: true });
  }

  const daoResponse = await dao.getMany(queryInstance, { limit, offset });

  const data = factory.createMany(daoResponse);

  return { data: data as Array<T> };
};