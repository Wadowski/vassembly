import { braveSearchMcpRuntimeAdapter } from './brave-search-mcp';
import { googleWorkspaceMcpRuntimeAdapter } from './google-workspace-mcp';

import type { McpRuntimeAdapter } from './types';

export type { McpRuntimeAdapter, McpRuntimeAdapterParams, McpServerConfig } from './types';

const defaultAdapter: McpRuntimeAdapter = {
  toServerConfig: () => null,
};

const ADAPTERS: Record<string, McpRuntimeAdapter> = {
  'google-workspace-mcp': googleWorkspaceMcpRuntimeAdapter,
  'brave-search-mcp': braveSearchMcpRuntimeAdapter,
};

export interface GetMcpRuntimeAdapterParams {
  slug: string;
}

export const getMcpRuntimeAdapter = ({ slug }: GetMcpRuntimeAdapterParams): McpRuntimeAdapter =>
  ADAPTERS[slug] ?? defaultAdapter;
