import type { McpConfigSchema } from '../model/configSchema';
import type { McpTransportValue } from '../model/transport';

export interface McpSeedEntry {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  category?: string;
  transport: McpTransportValue;
  dockerImage?: string;
  configSchema?: McpConfigSchema;
}

export interface LoadMcpsResult {
  insertedCount: number;
  skippedCount: number;
  removedCount: number;
}
