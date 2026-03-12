import { MongoDbDAO } from "@vassembly/client-mongodb";
import { UserModel } from "../model";

export const userMongodbDao = MongoDbDAO<UserModel>({
  collectionName: "users",
});
