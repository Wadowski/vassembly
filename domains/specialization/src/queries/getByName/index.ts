import { toSpecializationResponse } from '../../model';
import { getModelByName } from '../getModelByName';

import type { GetByNameParams, GetByNameResult } from './types';

export type { GetByNameParams, GetByNameResult } from './types';

export const getByName = async ({ name }: GetByNameParams): Promise<GetByNameResult> => {
  const result = await getModelByName({ name });

  return {
    data: toSpecializationResponse({ specialization: result.data }),
  };
};
