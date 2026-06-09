import type { McpTestAdapter, McpTestAdapterParams, McpTestAdapterResult } from './types';

export const braveSearchMcpAdapter: McpTestAdapter = {
  test: async ({ fieldValues }: McpTestAdapterParams): Promise<McpTestAdapterResult> => {
    const apiKey = fieldValues.apiKey;

    if (typeof apiKey === 'string' && apiKey.length > 0 && apiKey !== 'invalid') {
      return { success: true };
    }

    return { success: false, error: 'Invalid or missing API key' };
  },
};
