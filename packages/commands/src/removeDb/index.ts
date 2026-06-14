import type { Model } from "@vassembly/model";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { RemoveDbHandler } from "./types";
import { z } from "zod";

const VALIDATION_SCHEMA = z.object({
  id: z.uuid(),
});

export const removeDb = <T extends Model>({
  factory,
  dao,
}: CommonDbCommandGeneratorParams<T>): RemoveDbHandler =>
  async ({ id }) => {
    const queryInstance = factory.create({ id } as Partial<T>, { validationSchema: VALIDATION_SCHEMA });
    queryInstance.isValid({ shouldThrow: true });

    await dao.remove(queryInstance);

    return { success: true };
  };
