import type { McpListItemResponse } from '@vassembly/domain-mcp';

export interface GetMcpInput {
  id: string;
}

export interface GetMcpResult {
  data: McpListItemResponse;
}

export interface ServiceContext {
  authenticatedUserId: string;
}
