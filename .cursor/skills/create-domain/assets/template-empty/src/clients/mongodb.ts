import { MongoDbDAO } from "@vassembly/client-mongodb";
import { DomainModel } from "../model";

export const domainMongodbDao = MongoDbDAO<DomainModel>({
  collectionName: "domains",
});
