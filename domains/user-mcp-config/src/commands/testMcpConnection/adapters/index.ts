import { braveSearchMcpAdapter } from './brave-search-mcp';
import { wikipediaMcpAdapter } from './wikipedia-mcp';

import type { McpTestAdapter, McpTestAdapterParams, McpTestAdapterResult } from './types';

export type { McpTestAdapter, McpTestAdapterParams, McpTestAdapterResult };

const defaultAdapter: McpTestAdapter = {
  test: async ({ fieldValues }: McpTestAdapterParams): Promise<McpTestAdapterResult> => {
    const hasValue = Object.values(fieldValues).some(
      (value) => value !== undefined && value !== null && value !== '',
    );

    if (hasValue) {
      return { success: true };
    }

    return { success: false, error: 'Missing required field values' };
  },
};

const ADAPTERS: Record<string, McpTestAdapter> = {
  'brave-search-mcp': braveSearchMcpAdapter,
  'wikipedia-mcp': wikipediaMcpAdapter,
};

export interface GetMcpTestAdapterParams {
  slug: string;
}

export const getMcpTestAdapter = ({ slug }: GetMcpTestAdapterParams): McpTestAdapter =>
  ADAPTERS[slug] ?? defaultAdapter;
