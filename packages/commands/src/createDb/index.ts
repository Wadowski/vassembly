import type { Model } from "@vassembly/model";
import { getDbById } from "@vassembly/queries";
import { WrongParamError } from "@vassembly/errors";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { CreateDbHandler } from "./types";

const CONSOLE_LOG_PREFIX = "command :: createDb ::";

export const createDb = <T extends Model>({
  factory,
  dao,
  validationSchema,
}: CommonDbCommandGeneratorParams<T>): CreateDbHandler<T> =>
  async ({ ...data }) => {
    const commandInstance = factory.create(data as unknown as Partial<T>, { validationSchema });
    if (validationSchema) {
      commandInstance.isValid({ shouldThrow: true });
    }

    const createdId = await dao.create(commandInstance);
    if (!createdId) {
      throw new WrongParamError(
        `${CONSOLE_LOG_PREFIX} Failed to create instance`
      );
    }
    const result = await getDbById({ factory, dao })({ id: createdId });

    return { data: result.data };
  };
