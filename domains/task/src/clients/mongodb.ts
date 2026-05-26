import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';

import type { TaskModel } from '../model/model';

export const TASK_COLLECTION_NAME = 'tasks';

export const taskMongodbDao = MongoDbDAO<TaskModel>({
  collectionName: TASK_COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(TASK_COLLECTION_NAME);
  await collection.createIndex({ userId: 1, createdAt: -1 });
};
