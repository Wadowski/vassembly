import type { Model } from "@vassembly/model";
import { getDbById } from "@vassembly/queries";
import { WrongParamError } from "@vassembly/errors";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { RemoveSoftDbHandler } from "./types";

const CONSOLE_LOG_PREFIX = "command :: removeSoftDb ::";

export const removeSoftDb = <T extends Model>({
  factory,
  dao,
}: CommonDbCommandGeneratorParams<T>): RemoveSoftDbHandler<T> =>
  async ({ id }) => {
    if (!id) {
      throw new WrongParamError(
        `${CONSOLE_LOG_PREFIX} Id is missing`
      );
    }

    const updateData = {
      removedAt: new Date(),
    } as Partial<T>;

    const updatedInstance = factory.create(updateData);
    const queryInstance = factory.create({ id } as Partial<T>);
    await dao.update(queryInstance, updatedInstance);
    const result = await getDbById({ factory, dao })({ id });

    return { data: result.data };
  };
