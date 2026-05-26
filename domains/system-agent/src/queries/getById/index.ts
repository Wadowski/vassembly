import { toSystemAgentResponse } from '../../model';
import { getModelById } from '../getModelById/index';

import type { GetByIdParams, GetByIdResult } from './types';

export const getById = async ({ id }: GetByIdParams): Promise<GetByIdResult> => {
  const result = await getModelById({ id });

  return {
    data: toSystemAgentResponse({
      systemAgent: result.data,
    }),
  };
};
