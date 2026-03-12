import { removeDb } from "@vassembly/commands";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const removeDbModule = removeDb<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});
