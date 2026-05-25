import { AgentStatus } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory, toCatalogDetail } from '../../model';

import type { GetActiveByIdParams, GetActiveByIdResult } from './types';

export const getActiveById = async ({ id }: GetActiveByIdParams): Promise<GetActiveByIdResult> => {
  try {
    const raw = await systemAgentMongodbDao.get(systemAgentFactory.create({ id }));

    if (!raw || raw.id === undefined) {
      return { data: null };
    }

    const systemAgent = systemAgentFactory.create(raw);

    if (systemAgent.status !== AgentStatus.Active || systemAgent.removedAt != null) {
      return { data: null };
    }

    return {
      data: toCatalogDetail({ systemAgent }),
    };
  } catch (error) {
    return { data: null, error };
  }
};
