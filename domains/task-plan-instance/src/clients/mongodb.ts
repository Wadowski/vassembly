import { MongoDbDAO, mongoDb } from '@vassembly/client-mongodb';
import type { MongoDbDAOType } from '@vassembly/client-mongodb';

import { TaskPlanInstanceModel, taskPlanInstanceFactory } from '../model';

export const TASK_PLAN_INSTANCE_COLLECTION_NAME = 'taskPlanInstances';

const baseDao = MongoDbDAO<TaskPlanInstanceModel>({
  collectionName: TASK_PLAN_INSTANCE_COLLECTION_NAME,
});

type TaskPlanInstanceMongodbDao = MongoDbDAOType<TaskPlanInstanceModel> & {
  findOne: (filter: Record<string, unknown>) => Promise<TaskPlanInstanceModel | null>;
  find: (filter: Record<string, unknown>) => Promise<TaskPlanInstanceModel[]>;
};

export const taskPlanInstanceMongodbDao: TaskPlanInstanceMongodbDao = {
  ...baseDao,
  findOne: async (filter: Record<string, unknown>): Promise<TaskPlanInstanceModel | null> => {
    const row = await baseDao.getRaw(filter);

    if (!row?.id) {
      return null;
    }

    return taskPlanInstanceFactory.create(row as Partial<TaskPlanInstanceModel>);
  },
  find: async (filter: Record<string, unknown>): Promise<TaskPlanInstanceModel[]> => {
    const rows = await baseDao.getManyRaw(filter, {
      sort: { createdAt: 1, _id: 1 },
    });

    return rows.map((row) =>
      taskPlanInstanceFactory.create(row as Partial<TaskPlanInstanceModel>),
    );
  },
};

export const mongodbIndexes = async (): Promise<void> => {
  const collection = mongoDb.db.collection(TASK_PLAN_INSTANCE_COLLECTION_NAME);
  await collection.createIndex({ commentId: 1 }, { unique: true, name: 'idx_commentId_unique' });
  await collection.createIndex({ taskId: 1, createdAt: 1 }, { name: 'idx_taskId_createdAt' });
};
