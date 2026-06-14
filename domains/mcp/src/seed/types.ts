import type { McpConfigSchema } from '../model/configSchema';

export interface McpSeedEntry {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  configSchema?: McpConfigSchema;
}

export interface LoadMcpsResult {
  insertedCount: number;
  skippedCount: number;
}
