import type { Model } from "@vassembly/model";
import type { CommonDbQueryGeneratorParams } from "../types";
import { GetListDbByQueryHandler } from "./types";

export const getListDbByQuery = <T extends Model>({ factory, dao }: CommonDbQueryGeneratorParams<T>): GetListDbByQueryHandler<T> => async ({ limit, offset, ...query }) => {
  const queryInstance = factory.create(query as Partial<T>);

  const daoResponse = await dao.getMany(queryInstance, { limit, offset });

  const data = factory.createMany(daoResponse);

  return { data: data as Array<T> };
};