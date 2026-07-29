import { taskPlanInstanceMongodbDao } from '../../clients';
import { toTaskPlanInstanceResponse } from '../../model';

import type { GetByTaskIdParams, GetByTaskIdResult } from './types';

export type { GetByTaskIdParams, GetByTaskIdResult } from './types';

export const getByTaskId = async ({ taskId }: GetByTaskIdParams): Promise<GetByTaskIdResult> => {
  const instances = await taskPlanInstanceMongodbDao.find({ taskId });

  return {
    data: instances.map((instance) =>
      toTaskPlanInstanceResponse({ taskPlanInstance: instance }),
    ),
  };
};
