import type { McpServerConfig } from '../types';

export interface McpRuntimeAdapterParams {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
}

export interface McpRuntimeAdapter {
  toServerConfig: (params: McpRuntimeAdapterParams) => McpServerConfig | null;
}

export type { McpServerConfig };
