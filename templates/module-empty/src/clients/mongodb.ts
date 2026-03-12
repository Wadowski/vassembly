import { MongoDbDAO } from "@vassembly/client-mongodb";
import { ModuleModel } from "../model";

export const moduleMongodbDao = MongoDbDAO<ModuleModel>({
  collectionName: "modules",
});
