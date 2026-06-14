import { MongoDbDAO } from '@vassembly/client-mongodb';

import { COLLECTION_NAME } from '../constants';
import type { McpModel } from '../model';

export const mcpMongodbDao = MongoDbDAO<McpModel>({
  collectionName: COLLECTION_NAME,
});

export const getMcpsCollection = (): typeof mcpMongodbDao.collection => {
  return mcpMongodbDao.collection;
};

export const mongodbIndexes = async (): Promise<void> => {
  const collection = getMcpsCollection();

  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ name: 1 }, { unique: true });
  await collection.createIndex({ tags: 1 });
  await collection.createIndex({ name: 'text', description: 'text' });
};
