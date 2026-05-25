import { useCallback } from 'react';

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

import type { SystemAgentCatalogItem, SystemAgentCatalogQuery, SystemAgentListResponse } from './types';

export const useSystemAgentCatalog = () => {
  const httpClient = useHttpClient();
  const requestFn = useCallback(
    async ({ query }: { query?: SystemAgentCatalogQuery }) =>
      httpClient.get<SystemAgentListResponse<SystemAgentCatalogItem>>({
        path: '/system-agents/catalog',
        query: query as Record<string, string | number | boolean> | undefined,
        withAuth: true,
      }),
    [httpClient],
  );

  return useFetch({ requestFn });
};
