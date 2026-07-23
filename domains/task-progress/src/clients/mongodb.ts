import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';

import type { TaskProgressModel } from '../model/model';

export const TASK_PROGRESS_COLLECTION_NAME = 'taskProgress';

export const taskProgressMongodbDao = MongoDbDAO<TaskProgressModel>({
  collectionName: TASK_PROGRESS_COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(TASK_PROGRESS_COLLECTION_NAME);
  await collection.createIndex({ commentId: 1 }, { unique: true, name: 'idx_commentId_unique' });
  await collection.createIndex({ taskId: 1, createdAt: 1 }, { name: 'idx_taskId_createdAt' });
  await collection.createIndex(
    { userId: 1, createdAt: -1 },
    { name: 'idx_userId_createdAt' }
  );
};
