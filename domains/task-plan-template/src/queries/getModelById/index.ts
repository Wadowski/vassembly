import { getDbById } from '@vassembly/queries';

import { taskPlanTemplateMongodbDao } from '../../clients';
import { TaskPlanTemplateModel, taskPlanTemplateFactory } from '../../model';

export const getModelById = getDbById<TaskPlanTemplateModel>({
  dao: taskPlanTemplateMongodbDao,
  factory: taskPlanTemplateFactory,
});
