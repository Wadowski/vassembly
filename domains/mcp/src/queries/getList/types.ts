import type { McpListItemResponse } from '../../model';

export interface GetListParams {
  page?: number;
  size?: number;
  search?: string;
  tags?: string[];
}

export interface GetListResult {
  items: McpListItemResponse[];
  total: number;
  page: number;
  size: number;
}

export interface BuildListFilterParams {
  search?: string;
  tags?: string[];
}
