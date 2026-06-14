import type { Model } from "@vassembly/model";
import { WrongParamError } from "@vassembly/errors";
import { getDbById } from "@vassembly/queries";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { UpdateDbHandler } from "./types";
import { z } from "zod";

const VALIDATION_SCHEMA = z.object({
  id: z.string(),
});

export const updateDbById = <T extends Model>({
  factory,
  dao,
  validationSchema: updateValidationSchema,
}: CommonDbCommandGeneratorParams<T>): UpdateDbHandler<T> =>
  async ({ id, data }) => {
    const queryInstance = factory.create({ id } as Partial<T>, { validationSchema: VALIDATION_SCHEMA });
    queryInstance.isValid({ shouldThrow: true });

    if (updateValidationSchema) {
      const validationResult = updateValidationSchema.safeParse(data);
      if (!validationResult.success) {
        throw new WrongParamError("Validation failed", validationResult.error);
      }
    }

    const updatedInstance = factory.create(data as Partial<T>);

    await dao.update(queryInstance, updatedInstance);
    const result = await getDbById({ factory, dao })({ id });

    return { data: result.data };
  };
