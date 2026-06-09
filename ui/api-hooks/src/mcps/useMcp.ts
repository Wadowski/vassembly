import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { GET_MCP_QUERY } from './queries/GET_MCP_QUERY';
import type { McpDetail, UseMcpResult } from './types';

interface GraphQLMcpData {
  mcp?: McpDetail | null;
}

interface GetMcpVariables {
  id: string;
}

/**
 * Fetches a single MCP by id including config schema and configuration status.
 */
export function useMcp(mcpId: string): UseMcpResult {
  const { data, isLoading, error } = useApolloQuery<GraphQLMcpData, GetMcpVariables>(GET_MCP_QUERY, {
    variables: { id: mcpId },
    skip: mcpId === '',
    withAuth: true,
  });

  const mappedData = useMemo(() => {
    if (data === undefined) {
      return undefined;
    }

    return {
      mcp: data.mcp ?? null,
    };
  }, [data]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
  };
}
