import type { SeedContext } from '@vassembly/e2e';

export interface McpCatalogEntry {
  name: string;
  provider: string;
  description: string;
}

export interface SeedMcpParams {
  context: SeedContext;
  name: string;
  provider: string;
  description: string;
}

export interface EnsureMcpIndexesParams {
  context: SeedContext;
}
