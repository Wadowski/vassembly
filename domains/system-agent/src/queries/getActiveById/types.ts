import type { SystemAgentCatalogDetail } from '../../model';

export interface GetActiveByIdParams {
  id: string;
}

export interface GetActiveByIdResult {
  data: SystemAgentCatalogDetail | null;
  error?: unknown;
}
