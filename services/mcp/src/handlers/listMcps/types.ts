import type { McpListItemResponse } from '@vassembly/domain-mcp';

export interface ListMcpsInput {
  page?: number;
  size?: number;
  search?: string;
  tags?: string[];
  specializationId?: string;
}

export interface ListMcpsResult {
  items: McpListItemResponse[];
  total: number;
  page: number;
  size: number;
}

export interface ServiceContext {
  authenticatedUserId: string;
}
