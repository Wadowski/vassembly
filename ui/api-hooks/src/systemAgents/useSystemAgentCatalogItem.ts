import { useCallback } from 'react';

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

import type { SystemAgentCatalogDetail } from './types';

export interface SystemAgentCatalogItemQuery {
  id: string;
}

export const useSystemAgentCatalogItem = () => {
  const httpClient = useHttpClient();
  const requestFn = useCallback(
    async ({ query }: { query?: SystemAgentCatalogItemQuery }) => {
      const agentId = query?.id;
      if (agentId === undefined || agentId === '') {
        throw new Error('System agent id is required');
      }
      return httpClient.get<SystemAgentCatalogDetail>({
        path: `/system-agents/catalog/${agentId}`,
        withAuth: true,
      });
    },
    [httpClient],
  );

  return useFetch({ requestFn });
};
