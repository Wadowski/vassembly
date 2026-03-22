import { removeDb } from "@vassembly/commands";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const remove = removeDb<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});
