export interface McpServerConfig {
  serverName: string;
  transport: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface ResolveMcpServerConfigsParams {
  userId: string;
  mcpConfigs: Array<{ mcpId: string; slug: string; serverUrl?: string | null }>;
}

export interface ResolveMcpServerConfigsResult {
  serverConfigs: McpServerConfig[];
  skippedMcpIds: string[];
}
