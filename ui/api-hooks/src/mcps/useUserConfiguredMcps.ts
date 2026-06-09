import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { GET_USER_CONFIGURED_MCPS_QUERY } from './queries/GET_USER_CONFIGURED_MCPS_QUERY';
import { sortConfiguredMcpsByUpdatedAt } from './sortConfiguredMcpsByUpdatedAt';
import type { UserConfiguredMcpItem, UseUserConfiguredMcpsResult } from './types';

interface GraphQLUserConfiguredMcpsData {
  userConfiguredMcps?: {
    items: UserConfiguredMcpItem[];
  };
}

/**
 * Fetches all MCPs configured by the current user, sorted by most recently updated.
 */
export function useUserConfiguredMcps(): UseUserConfiguredMcpsResult {
  const { data, isLoading, error } = useApolloQuery<GraphQLUserConfiguredMcpsData>(
    GET_USER_CONFIGURED_MCPS_QUERY,
    {
      withAuth: true,
    },
  );

  const mappedData = useMemo(() => {
    if (data === undefined) {
      return undefined;
    }

    const items = data.userConfiguredMcps?.items ?? [];

    return {
      mcps: sortConfiguredMcpsByUpdatedAt({ items }),
    };
  }, [data]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
  };
}
