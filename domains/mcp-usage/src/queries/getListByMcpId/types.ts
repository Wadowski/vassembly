import type { McpUsageEventResponse } from '../../model';

export interface GetListByMcpIdParams {
  mcpId: string;
  userId: string;
  page?: number;
  size?: number;
}

export interface GetListByMcpIdResult {
  items: McpUsageEventResponse[];
  total: number;
  page: number;
  size: number;
}
