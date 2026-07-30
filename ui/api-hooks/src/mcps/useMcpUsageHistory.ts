import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { GET_MCP_USAGE_HISTORY_QUERY } from './queries/GET_MCP_USAGE_HISTORY_QUERY';

export interface McpUsageHistoryItem {
  id: string;
  mcpId: string;
  mcpSlug: string | null;
  toolName: string;
  toolDisplayName: string | null;
  userId: string;
  taskId: string | null;
  commentId: string | null;
  agentId: string;
  agentName: string | null;
  taskTitle: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  input: string | null;
  inputTruncated: boolean;
  output: string | null;
  outputTruncated: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseMcpUsageHistoryArgs {
  mcpId: string;
  page?: number;
  size?: number;
}

export interface UseMcpUsageHistoryResult {
  items: McpUsageHistoryItem[];
  total: number;
  page: number;
  size: number;
  loading: boolean;
  error: unknown;
}

interface GraphQLMcpUsageHistoryData {
  mcpUsageHistory?: {
    items?: McpUsageHistoryItem[] | null;
    total?: number | null;
    page?: number | null;
    size?: number | null;
  } | null;
}

interface GetMcpUsageHistoryVariables {
  mcpId: string;
  page?: number;
  size?: number;
}

export const useMcpUsageHistory = ({
  mcpId,
  page = 0,
  size = 20,
}: UseMcpUsageHistoryArgs): UseMcpUsageHistoryResult => {
  const { data, isLoading, error } = useApolloQuery<
    GraphQLMcpUsageHistoryData,
    GetMcpUsageHistoryVariables
  >(GET_MCP_USAGE_HISTORY_QUERY, {
    variables: { mcpId, page, size },
    skip: mcpId === '',
    withAuth: true,
    pollInterval: 3000,
  });

  const mapped = useMemo(() => {
    const history = data?.mcpUsageHistory;

    return {
      items: history?.items ?? [],
      total: history?.total ?? 0,
      page: history?.page ?? page,
      size: history?.size ?? size,
    };
  }, [data, page, size]);

  return {
    ...mapped,
    loading: isLoading,
    error,
  };
};
