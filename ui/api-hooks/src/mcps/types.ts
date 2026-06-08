export interface McpListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  slug: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseMcpsArgs {
  page?: number;
  size?: number;
  search?: string;
  tags?: string[];
}

export interface UseMcpsResult {
  data?: {
    items: McpListItem[];
    total: number;
    page: number;
    size: number;
  };
  loading: boolean;
  error?: Error;
  execute: (args: UseMcpsArgs) => Promise<void>;
}
