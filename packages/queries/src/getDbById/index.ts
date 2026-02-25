import type { Model } from "@vassembly/model";
import { NotFoundError, WrongParamError } from "@vassembly/errors";
import type { CommonDbQueryGeneratorParams } from "../types";
import { GetDbByIdHandler } from "./types";

const CONSOLE_LOG_PREFIX = "query :: getDbById ::";

export const getDbById = <T extends Model>({ factory, dao }: CommonDbQueryGeneratorParams<T>): GetDbByIdHandler<T> => async ({ id }) => {
  const queryInstance = factory.create({ id } as Partial<T>);

  if (!queryInstance.id) {
    throw new WrongParamError(`${CONSOLE_LOG_PREFIX} Id is missing`);
  }

  const daoResponse = await dao.get(queryInstance);

  if (!daoResponse) {
    throw new NotFoundError(`${CONSOLE_LOG_PREFIX} Instance with id ${id} not found`);
  }
  const data = factory.create(daoResponse);

  return { data };
};