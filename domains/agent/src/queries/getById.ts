import { toAgentResponse } from '../model';

import { getModelById } from './getModelById';

import type { AgentResponse } from '../model';
import type { GetAgentByIdQueryInput } from './getById.types';

export interface GetAgentByIdQueryResult {
  data: AgentResponse;
}

export const getById = async (input: GetAgentByIdQueryInput): Promise<GetAgentByIdQueryResult> => {
  const result = await getModelById(input);

  return {
    data: toAgentResponse({ agent: result.data }),
  };
};
