import { getDbByQuery } from "@vassembly/queries";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const getModuleListAll = getDbByQuery<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});