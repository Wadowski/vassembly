import type { Model } from "@vassembly/model";
import { getDbById } from "@vassembly/queries";
import { WrongParamError } from "@vassembly/errors";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { UpdateDbHandler } from "./types";

const CONSOLE_LOG_PREFIX = "command :: updateDbById ::";

export const updateDbById = <T extends Model>({
  factory,
  dao,
}: CommonDbCommandGeneratorParams<T>): UpdateDbHandler<T> =>
  async ({ id, data }) => {
    if (!id) {
      throw new WrongParamError(
        `${CONSOLE_LOG_PREFIX} Id is missing or invalid`
      );
    }

    const updatedInstance = factory.create(data as Partial<T>);
    const queryInstance = factory.create({ id } as Partial<T>);
    await dao.update(queryInstance, updatedInstance);
    const result = await getDbById({ factory, dao })({ id });

    return { data: result.data };
  };
