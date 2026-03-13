import type { Model } from "@vassembly/model";
import { getDbById } from "@vassembly/queries";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { RemoveSoftDbHandler } from "./types";
import { z } from "zod";

const VALIDATION_SCHEMA = z.object({
  id: z.uuid(),
});

export const removeSoftDb = <T extends Model>({
  factory,
  dao,
}: CommonDbCommandGeneratorParams<T>): RemoveSoftDbHandler<T> =>
  async ({ id }) => {
    const queryInstance = factory.create({ id } as Partial<T>, { validationSchema: VALIDATION_SCHEMA });
    queryInstance.isValid({ shouldThrow: true });

    const updateData = {
      removedAt: new Date(),
    } as Partial<T>;
    const updatedInstance = factory.create(updateData);

    await dao.update(queryInstance, updatedInstance);
    const result = await getDbById({ factory, dao })({ id });

    return { data: result.data };
  };
