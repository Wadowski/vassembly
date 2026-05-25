import type { AgentCategory, SystemAgentCatalogListItem } from '@vassembly/domain-system-agent';

export interface ListCatalogParams {
  userId: string;
  search?: string;
  category?: AgentCategory;
  page?: number;
  size?: number;
}

export interface ListCatalogResult {
  items: SystemAgentCatalogListItem[];
  total: number;
  page: number;
  size: number;
}
