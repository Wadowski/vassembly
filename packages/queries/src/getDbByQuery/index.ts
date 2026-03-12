import type { Model } from "@vassembly/model";
import type { CommonDbQueryGeneratorParams } from "../types";
import { GetListDbByQueryHandler } from "./types";

export const getListDbByQuery = <T extends Model>({ factory, dao, validationSchema }: CommonDbQueryGeneratorParams<T>): GetListDbByQueryHandler<T> => async ({ limit, offset, ...query }) => {
  const queryInstance = factory.create(query as Partial<T>, { validationSchema });

  if (validationSchema) {
    queryInstance.isValid({ shouldThrow: true });
  }

  const daoResponse = await dao.getMany(queryInstance, { limit, offset });

  const data = factory.createMany(daoResponse);

  return { data: data as Array<T> };
};