import { updateDbById } from "@vassembly/commands";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({});

export const update = updateDbById<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
  validationSchema: VALIDATION_SCHEMA,
});
