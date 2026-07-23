import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';

import type { TaskCommentModel } from '../model/model';

export const TASK_COMMENT_COLLECTION_NAME = 'taskComments';

export const taskCommentMongodbDao = MongoDbDAO<TaskCommentModel>({
  collectionName: TASK_COMMENT_COLLECTION_NAME,
});

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(TASK_COMMENT_COLLECTION_NAME);
  await collection.createIndex({ taskId: 1, createdAt: 1 }, { name: 'idx_taskId_createdAt' });
};
