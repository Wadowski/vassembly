export interface McpListItemResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  documentationUrl: string | null;
  repositoryUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
