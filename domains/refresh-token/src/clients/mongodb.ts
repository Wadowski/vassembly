import { MongoDbDAO } from "@vassembly/client-mongodb";
import { RefreshTokenModel } from "../model";

export const refreshTokenMongodbDao = MongoDbDAO<RefreshTokenModel>({
  collectionName: "refreshTokens",
});
