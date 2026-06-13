import type { McpConfigSchema } from './configSchema';

export interface McpListItemResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  documentationUrl: string | null;
  repositoryUrl: string | null;
  configurationStatus?: string | null;
  configSchema?: McpConfigSchema | null;
  agentUsageCount?: number;
  createdAt: string;
  updatedAt: string;
}
