import type { Model } from "@vassembly/model";
import { getDbById } from "@vassembly/queries";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { UpdateDbHandler } from "./types";
import { z } from "zod";

const VALIDATION_SCHEMA = z.object({
  id: z.uuid(),
});

export const updateDbById = <T extends Model>({
  factory,
  dao,
  validationSchema: updateValidationSchema,
}: CommonDbCommandGeneratorParams<T>): UpdateDbHandler<T> =>
  async ({ id, data }) => {
    const queryInstance = factory.create({ id } as Partial<T>, { validationSchema: VALIDATION_SCHEMA });
    queryInstance.isValid({ shouldThrow: true });

    const updatedInstance = factory.create(data as Partial<T>, { validationSchema: updateValidationSchema });
    if (updateValidationSchema) {
      updatedInstance.isValid({ shouldThrow: true });
    }

    await dao.update(queryInstance, updatedInstance);
    const result = await getDbById({ factory, dao })({ id });

    return { data: result.data };
  };
