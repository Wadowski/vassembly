import type { McpUsageStatus } from './model';

export interface McpUsageEventResponse {
  id: string;
  mcpId: string;
  mcpSlug: string | null;
  toolName: string;
  userId: string;
  taskId: string | null;
  commentId: string | null;
  agentId: string;
  invocationId: string | null;
  rootInvokeId: string | null;
  status: McpUsageStatus;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  input: Record<string, unknown> | null;
  inputTruncated: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface McpUsageHistoryListResponse {
  items: McpUsageEventResponse[];
  total: number;
  page: number;
  size: number;
}
