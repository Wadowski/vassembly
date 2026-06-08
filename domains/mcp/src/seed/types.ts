export interface McpSeedEntry {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  documentationUrl?: string;
  repositoryUrl?: string;
}

export interface LoadMcpsResult {
  insertedCount: number;
  skippedCount: number;
}
