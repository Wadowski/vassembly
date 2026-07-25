import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';

import { COLLECTION_NAME, RETENTION_SECONDS } from '../constants';

import type { McpUsageEventModel } from '../model/model';

export const MCP_USAGE_COLLECTION_NAME = COLLECTION_NAME;

export const mcpUsageMongodbDao = MongoDbDAO<McpUsageEventModel>({
  collectionName: COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(COLLECTION_NAME);
  await collection.createIndex(
    { mcpId: 1, userId: 1, startedAt: -1 },
    { name: 'idx_mcpId_userId_startedAt' },
  );
  await collection.createIndex({ taskId: 1, startedAt: 1 }, { name: 'idx_taskId_startedAt' });
  await collection.createIndex(
    { startedAt: 1 },
    { name: 'idx_startedAt_ttl', expireAfterSeconds: RETENTION_SECONDS },
  );
};
