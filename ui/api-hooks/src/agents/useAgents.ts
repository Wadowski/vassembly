import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../graphql';

import { LIST_AGENTS_QUERY } from './listAgentsQuery';
import { mapAgentsListData } from './mapAgentsListData';
import type { AgentsListQuery, AgentsListResponse, GraphQLAgentsListData, ListAgentsVariables } from './types';

export type { AgentsListQuery };

export const useAgents = () => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLAgentsListData,
    ListAgentsVariables
  >(LIST_AGENTS_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => mapAgentsListData(graphQLData), [graphQLData]);

  const fetch = useCallback(
    async ({ query }: { query?: AgentsListQuery }): Promise<AgentsListResponse | undefined> => {
      const result = await execute({
        page: query?.page,
        size: query?.size,
        search: query?.search,
        status: query?.status,
      });
      return mapAgentsListData(result.data);
    },
    [execute],
  );

  return { data, isLoading, error, fetch };
};
