import { getDbById } from "@vassembly/queries";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const getModuleById = getDbById<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});