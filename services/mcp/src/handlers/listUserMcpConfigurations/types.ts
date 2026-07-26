import type { EnrichedMcpListItem } from '../enrichMcpListWithUserStatus/types';

export interface ListUserMcpConfigurationsInput {
  page?: number;
  size?: number;
}

export interface ListUserMcpConfigurationsResult {
  items: EnrichedMcpListItem[];
  total: number;
  page: number;
  size: number;
}
