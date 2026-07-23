import { getDbById } from '@vassembly/queries';

import { taskCommentMongodbDao } from '../../clients';
import { TaskCommentModel, taskCommentFactory } from '../../model';

export const getModelById = getDbById<TaskCommentModel>({
  dao: taskCommentMongodbDao,
  factory: taskCommentFactory,
});
