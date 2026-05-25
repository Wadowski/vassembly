import type { HttpClient } from '../../http/types';

import type { SystemAgentCatalogDetail } from '../types';

export interface GetCatalogItemParams {
  client: HttpClient;
  id: string;
}

export const getCatalogItem = async ({
  client,
  id,
}: GetCatalogItemParams): Promise<SystemAgentCatalogDetail> => {
  if (id === undefined || id === '') {
    throw new Error('System agent id is required');
  }

  return client.get<SystemAgentCatalogDetail>({
    path: `/system-agents/catalog/${id}`,
    withAuth: true,
  });
};
