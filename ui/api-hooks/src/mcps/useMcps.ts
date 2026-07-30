import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { GET_MCPS_QUERY } from './queries/GET_MCPS_QUERY';
import type { McpWithConfigurationStatus, UseMcpsResult } from './types';

interface GraphQLMcpsData {
  mcps?: {
    items: McpWithConfigurationStatus[];
  };
}

/**
 * Fetches all MCPs with per-user configuration status.
 */
export function useMcps(): UseMcpsResult {
  const { data, isLoading, error, refetch } = useApolloQuery<GraphQLMcpsData>(GET_MCPS_QUERY, {
    fetchPolicy: 'cache-and-network',
    withAuth: true,
  });

  const mappedData = useMemo(() => {
    if (data === undefined) {
      return undefined;
    }

    return {
      mcps: data.mcps?.items ?? [],
    };
  }, [data]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
    refetch: () => refetch(),
  };
}
