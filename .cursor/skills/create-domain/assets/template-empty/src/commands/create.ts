import { createDb } from "@vassembly/commands";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({});

export const create = createDb<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
  validationSchema: VALIDATION_SCHEMA,
});
