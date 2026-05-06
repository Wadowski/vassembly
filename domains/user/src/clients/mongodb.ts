import { MongoDbDAO, mongoDb } from "@vassembly/client-mongodb";
import { UserModel } from "../model";

export const USER_COLLECTION_NAME = "users";

export const userMongodbDao = MongoDbDAO<UserModel>({
  collectionName: USER_COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(USER_COLLECTION_NAME);
  await collection.createIndex(
    { email: 1 },
    {
      name: "users_email_unique_active_only",
      unique: true,
      partialFilterExpression: {
        removedAt: { $type: "null" }
      },
    },
  );
};

