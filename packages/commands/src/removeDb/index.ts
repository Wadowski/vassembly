import type { Model } from "@vassembly/model";
import { WrongParamError } from "@vassembly/errors";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { RemoveDbHandler } from "./types";

const CONSOLE_LOG_PREFIX = "command :: removeDb ::";

export const removeDb = <T extends Model>({
  factory,
  dao,
}: CommonDbCommandGeneratorParams<T>): RemoveDbHandler<T> =>
  async ({ id }) => {
    if (!id) {
      throw new WrongParamError(
        `${CONSOLE_LOG_PREFIX} Id is missing`
      );
    }

    const queryInstance = factory.create({ id } as Partial<T>);
    await dao.remove(queryInstance);

    return { success: true };
  };
