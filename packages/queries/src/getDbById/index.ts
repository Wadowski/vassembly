import type { Model } from "@vassembly/model";
import { NotFoundError, WrongParamError } from "@vassembly/errors";
import type { CommonDbQueryGeneratorParams } from "../types";
import { GetDbByIdHandler } from "./types";
import { z } from "zod";

const MONGODB_OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

const VALIDATION_SCHEMA = z.object({
  id: z.string().regex(MONGODB_OBJECT_ID_HEX, {
    message:
      "id must be a 24 character hexadecimal MongoDB ObjectId string",
  }),
});

const CONSOLE_LOG_PREFIX = "query :: getDbById ::";

export const getDbById = <T extends Model>({ factory, dao }: CommonDbQueryGeneratorParams<T>): GetDbByIdHandler<T> => async ({ id }) => {
  const queryInstance = factory.create({ id } as Partial<T>, { validationSchema: VALIDATION_SCHEMA });

  queryInstance.isValid({ shouldThrow: true });

  const daoResponse = await dao.get(queryInstance);

  if (!daoResponse) {
    throw new NotFoundError(`${CONSOLE_LOG_PREFIX} Instance with id ${id} not found`);
  }
  const data = factory.create(daoResponse);

  return { data };
};