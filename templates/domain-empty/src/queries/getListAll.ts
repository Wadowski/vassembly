import { getListDbByQuery } from "@vassembly/queries";
import { moduleMongodbDao } from "../clients";
import { ModuleModel, moduleFactory } from "../model";

export const getListAll = getListDbByQuery<ModuleModel>({
  dao: moduleMongodbDao,
  factory: moduleFactory,
});