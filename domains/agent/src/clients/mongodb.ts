import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';

import type { AgentModel } from '../model/model';

export const AGENT_COLLECTION_NAME = 'agents';

export const agentMongodbDao = MongoDbDAO<AgentModel>({
  collectionName: AGENT_COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(AGENT_COLLECTION_NAME);
  await collection.createIndex({ userId: 1 });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ userId: 1, status: 1 });
  await collection.createIndex({ userId: 1, integrationCredentialId: 1 });
  await collection.createIndex({ assignedMcpIds: 1 });
  await collection.createIndex({ userId: 1, assignedMcpIds: 1 });
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ name: 'text', description: 'text' });
};
