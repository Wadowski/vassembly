import { useCallback } from 'react';

import { useFetch } from '../http/useFetch';
import { useHttpClient } from '../http/useHttpClient';

import type { SystemAgentAdminItem, SystemAgentAdminListQuery, SystemAgentListResponse } from './types';

export const useSystemAgents = () => {
  const httpClient = useHttpClient();
  const requestFn = useCallback(
    async ({ query }: { query?: SystemAgentAdminListQuery }) =>
      httpClient.get<SystemAgentListResponse<SystemAgentAdminItem>>({
        path: '/system-agents',
        query: query as Record<string, string | number | boolean> | undefined,
        withAuth: true,
      }),
    [httpClient],
  );

  return useFetch({ requestFn });
};
