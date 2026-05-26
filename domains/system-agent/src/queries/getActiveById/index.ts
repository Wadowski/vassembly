import { getDbById } from '@vassembly/queries';
import { AgentStatus } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory, toSystemAgentResponse } from '../../model';

import type { GetActiveByIdParams, GetActiveByIdResult } from './types';
import type { SystemAgentModel } from '../../model';

const defaultGetById = getDbById<SystemAgentModel>({
  dao: systemAgentMongodbDao,
  factory: systemAgentFactory,
});

export const getActiveById = async ({ id }: GetActiveByIdParams): Promise<GetActiveByIdResult> => {
  const result = await defaultGetById({ id });

  if (result.data.status !== AgentStatus.Active || result.data.removedAt != null) {
    return { data: null };
  }

  return {
    data: toSystemAgentResponse({ systemAgent: result.data }),
  };
};
