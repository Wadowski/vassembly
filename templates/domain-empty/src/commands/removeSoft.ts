import { removeSoftDb } from "@vassembly/commands";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const removeSoft = removeSoftDb<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});
