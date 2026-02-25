import type { Model } from "@vassembly/model";
import { getDbById } from "@vassembly/queries";
import { WrongParamError } from "@vassembly/errors";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { CreateDbHandler } from "./types";

const CONSOLE_LOG_PREFIX = "command :: createDb ::";

export const createDb = <T extends Model>({
  factory,
  dao,
}: CommonDbCommandGeneratorParams<T>): CreateDbHandler<T> =>
  async ({ data }) => {
    const commandInstance = factory.create(data as Partial<T>);

    if (!commandInstance.id) {
      throw new WrongParamError(
        `${CONSOLE_LOG_PREFIX} Id is missing or invalid`
      );
    }

    await dao.create(commandInstance);
    const result = await getDbById({ factory, dao })({ id: commandInstance.id });

    return { data: result.data };
  };
