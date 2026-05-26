import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';
import type { SystemAgentAdminItem, SystemAgentAdminListQuery, SystemAgentListResponse } from './types';
import { LIST_SYSTEM_AGENTS_QUERY } from './graphql/listSystemAgentsQuery';

interface GraphQLSystemAgentsData {
  systemAgents: SystemAgentListResponse<SystemAgentAdminItem>;
}

export const useSystemAgents = () => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLSystemAgentsData,
    SystemAgentAdminListQuery
  >(LIST_SYSTEM_AGENTS_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => graphQLData?.systemAgents, [graphQLData]);

  const fetch = useCallback(
    async (query?: SystemAgentAdminListQuery): Promise<SystemAgentListResponse<SystemAgentAdminItem> | undefined> => {
      const result = await execute(query);
      return result.data?.systemAgents;
    },
    [execute],
  );

  return { data, isLoading, error, fetch };
};
