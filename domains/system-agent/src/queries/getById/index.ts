import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory, toSystemAgentResponse } from '../../model';

import type { GetByIdParams, GetByIdResult } from './types';

export const getById = async ({ id }: GetByIdParams): Promise<GetByIdResult> => {
  try {
    const raw = await systemAgentMongodbDao.get(systemAgentFactory.create({ id }));

    if (!raw || raw.id === undefined) {
      return { data: null };
    }

    return {
      data: toSystemAgentResponse({
        systemAgent: systemAgentFactory.create(raw),
      }),
    };
  } catch (error) {
    return { data: null, error };
  }
};
