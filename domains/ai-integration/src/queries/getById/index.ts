import { toAiIntegrationResponse } from '../../model';

import { getModelById } from '../getModelById';

import type { AiIntegrationCredentialResponse } from '../../model';
import type { GetAiIntegrationByIdQueryInput } from './types';

export interface GetAiIntegrationByIdQueryResult {
  data: AiIntegrationCredentialResponse;
}

export const getById = async (
  input: GetAiIntegrationByIdQueryInput,
): Promise<GetAiIntegrationByIdQueryResult> => {
  const result = await getModelById(input);

  return {
    data: toAiIntegrationResponse({ credential: result.data }),
  };
};
