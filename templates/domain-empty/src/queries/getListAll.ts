import { getListDbByQuery } from "@vassembly/queries";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const getModuleListAll = getListDbByQuery<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});