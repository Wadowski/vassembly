import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';

import type { AiIntegrationCredentialModel } from '../model/model';

export const AI_INTEGRATION_COLLECTION_NAME = 'aiIntegrationCredentials';

export const aiIntegrationMongodbDao = MongoDbDAO<AiIntegrationCredentialModel>({
  collectionName: AI_INTEGRATION_COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(AI_INTEGRATION_COLLECTION_NAME);
  await collection.createIndex({ userId: 1 });
  await collection.createIndex({ provider: 1 });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ userId: 1, status: 1 });
  await collection.createIndex({ userId: 1, provider: 1 });
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ name: 'text' });
};
