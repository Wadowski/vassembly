import { MongoDbDAO } from '@vassembly/client-mongodb';
import type { MongoDbDAOType } from '@vassembly/client-mongodb';

import { TaskPlanTemplateModel, taskPlanTemplateFactory } from '../model';

const baseDao = MongoDbDAO<TaskPlanTemplateModel>({
  collectionName: 'taskPlanTemplates',
});

type TaskPlanTemplateMongodbDao = MongoDbDAOType<TaskPlanTemplateModel> & {
  findOne: (filter: Record<string, unknown>) => Promise<TaskPlanTemplateModel | null>;
};

export const taskPlanTemplateMongodbDao: TaskPlanTemplateMongodbDao = {
  ...baseDao,
  findOne: async (filter: Record<string, unknown>): Promise<TaskPlanTemplateModel | null> => {
    const row = await baseDao.getRaw(filter);

    if (!row?.id) {
      return null;
    }

    return taskPlanTemplateFactory.create(row as Partial<TaskPlanTemplateModel>);
  },
};
