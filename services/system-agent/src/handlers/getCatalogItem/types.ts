import type { SystemAgentCatalogDetail } from '@vassembly/domain-system-agent';

export interface GetCatalogItemParams {
  userId: string;
  systemAgentId: string;
}

export interface GetCatalogItemResult {
  item: SystemAgentCatalogDetail;
}
