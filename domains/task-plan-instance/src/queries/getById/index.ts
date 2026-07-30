import { toTaskPlanInstanceResponse } from '../../model';
import { getModelById } from '../getModelById';

import type { GetByIdParams, GetByIdResult } from './types';

export type { GetByIdParams, GetByIdResult } from './types';

export const getById = async ({ id }: GetByIdParams): Promise<GetByIdResult> => {
  const result = await getModelById({ id });

  return {
    data: toTaskPlanInstanceResponse({ taskPlanInstance: result.data }),
  };
};
