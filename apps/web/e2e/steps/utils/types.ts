import type { BddWorld, SeedContext } from '@vassembly/e2e';

export interface WebBddWorld extends BddWorld {
  agentId?: string;
  integrationCredentialId?: string;
  taskId?: string;
  otherUserId?: string;
  otherUserTaskId?: string;
  showDeletedFilter?: boolean;
  pollingRequestCount?: number;
}

export interface SeedMcpParams {
  context: SeedContext;
  name: string;
  provider: string;
  description: string;
}

export interface SeedMcpCatalogParams {
  context: SeedContext;
}

export interface GetMcpIdBySlugParams {
  context: SeedContext;
  slug: string;
}

export interface EnsureMcpIndexesParams {
  context: SeedContext;
}
