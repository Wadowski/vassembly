import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { MCP_WITH_AGENTS_QUERY } from './queries/MCP_WITH_AGENTS_QUERY';
import type { McpWithAgentsData, UseMcpWithAgentsResult } from './types';

interface GraphQLMcpWithAgentsData {
  mcpWithAgents?: McpWithAgentsData | null;
}

interface McpWithAgentsVariables {
  mcpId: string;
  page?: number;
  size?: number;
}

/**
 * Fetches agents assigned to a configured MCP for the MCP detail page.
 */
export function useMcpWithAgents({
  mcpId,
  page = 0,
  size = 20,
  skip = false,
}: {
  mcpId: string;
  page?: number;
  size?: number;
  skip?: boolean;
}): UseMcpWithAgentsResult {
  const { data, isLoading, error, refetch } = useApolloQuery<
    GraphQLMcpWithAgentsData,
    McpWithAgentsVariables
  >(MCP_WITH_AGENTS_QUERY, {
    variables: { mcpId, page, size },
    skip: skip || mcpId === '',
    withAuth: true,
  });

  const mappedData = useMemo(() => {
    if (data === undefined) {
      return undefined;
    }

    return data.mcpWithAgents ?? null;
  }, [data]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
    refetch: () => {
      void refetch();
    },
  };
}
