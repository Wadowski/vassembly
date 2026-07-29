import { getDbById } from '@vassembly/queries';

import { taskPlanInstanceMongodbDao } from '../../clients';
import { TaskPlanInstanceModel, taskPlanInstanceFactory } from '../../model';

export const getModelById = getDbById<TaskPlanInstanceModel>({
  dao: taskPlanInstanceMongodbDao,
  factory: taskPlanInstanceFactory,
});
