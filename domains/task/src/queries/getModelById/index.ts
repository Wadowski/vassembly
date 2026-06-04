import { getDbById } from '@vassembly/queries';

import { taskMongodbDao } from '../../clients';
import { taskFactory } from '../../model';

import type { TaskModel } from '../../model';

export const getModelById = getDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
});
