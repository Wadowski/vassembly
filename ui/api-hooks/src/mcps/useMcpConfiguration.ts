import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { GET_MCP_CONFIGURATION_QUERY } from './queries/GET_MCP_CONFIGURATION_QUERY';
import type { McpConfiguration, UseMcpConfigurationResult } from './types';

interface GraphQLMcpConfigurationData {
  mcpConfiguration?: McpConfiguration | null;
}

interface GetMcpConfigurationVariables {
  mcpId: string;
}

/**
 * Fetches the current user's masked MCP configuration.
 */
export function useMcpConfiguration(mcpId: string): UseMcpConfigurationResult {
  const { data, isLoading, error } = useApolloQuery<
    GraphQLMcpConfigurationData,
    GetMcpConfigurationVariables
  >(GET_MCP_CONFIGURATION_QUERY, {
    variables: { mcpId },
    skip: mcpId === '',
    withAuth: true,
  });

  const mappedData = useMemo(() => {
    if (data === undefined) {
      return undefined;
    }

    return {
      configuration: data.mcpConfiguration ?? null,
    };
  }, [data]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
  };
}
