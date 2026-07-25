import type { McpUsageEventResponse } from '@vassembly/domain-mcp-usage';

export interface GetMcpUsageHistoryInput {
  mcpId: string;
  userId: string;
  page?: number;
  size?: number;
}

export interface McpUsageHistoryItem extends McpUsageEventResponse {
  agentName: string | null;
  taskTitle: string | null;
}

export interface GetMcpUsageHistoryResult {
  items: McpUsageHistoryItem[];
  total: number;
  page: number;
  size: number;
}
