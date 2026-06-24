import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';
import type { MongoDbDAOType } from '@vassembly/client-mongodb';

import { taskFactory } from '../model/factories';

import type { TaskModel } from '../model/model';

export const TASK_COLLECTION_NAME = 'tasks';

const baseDao = MongoDbDAO<TaskModel>({
  collectionName: TASK_COLLECTION_NAME,
});

export interface FindOneAndUpdateParams {
  filter: Partial<TaskModel>;
  update: Partial<TaskModel>;
}

type TaskMongodbDao = MongoDbDAOType<TaskModel> & {
  findOneAndUpdate: (params: FindOneAndUpdateParams) => Promise<TaskModel | null>;
};

const findOneAndUpdate = async ({
  filter,
  update,
}: FindOneAndUpdateParams): Promise<TaskModel | null> => {
  const whereQuery = taskFactory.create(filter).toMongoDb?.();

  if (!whereQuery) {
    return null;
  }

  const set = baseDao.transformToDeepUpdate(
    taskFactory.create({ ...update, updatedAt: new Date() }) as unknown as Record<string, unknown>,
  );

  const collection = mongoDb.db.collection(TASK_COLLECTION_NAME);
  const result = await collection.findOneAndUpdate(
    whereQuery,
    { $set: set },
    { returnDocument: 'after' },
  );

  if (!result) {
    return null;
  }

  return taskFactory.create({
    ...(result as Record<string, unknown>),
    id: result._id.toString(),
  });
};

export const taskMongodbDao: TaskMongodbDao = {
  ...baseDao,
  findOneAndUpdate,
};

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(TASK_COLLECTION_NAME);
  await collection.createIndex({ userId: 1, createdAt: -1 });
  await collection.createIndex({ specializationIds: 1 }, { sparse: true });
};
