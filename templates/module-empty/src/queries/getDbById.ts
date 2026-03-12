import { getDbById } from "@vassembly/queries";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const getModuleDbById = getDbById<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});