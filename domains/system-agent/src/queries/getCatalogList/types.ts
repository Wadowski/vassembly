import type { AgentCategory, SystemAgentCatalogListItem } from '../../model';

export interface GetCatalogListParams {
  search?: string;
  category?: AgentCategory;
  page?: number;
  size?: number;
}

export interface GetCatalogListResult {
  items: Array<SystemAgentCatalogListItem & { removedAt: null }>;
  page: number;
  size: number;
  totalCount: number;
}

export interface BuildCatalogListFilterParams {
  search?: string;
  category?: AgentCategory;
}
