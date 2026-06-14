import type { McpTestAdapter, McpTestAdapterParams, McpTestAdapterResult } from './types';

const isValidCredentials = ({ fieldValues }: McpTestAdapterParams): boolean => {
  const clientId = fieldValues.clientId;
  const clientSecret = fieldValues.clientSecret;

  return clientId === 'valid-id' && typeof clientSecret === 'string' && clientSecret.length > 0;
};

export const googleWorkspaceMcpAdapter: McpTestAdapter = {
  test: async (params: McpTestAdapterParams): Promise<McpTestAdapterResult> => {
    if (isValidCredentials(params)) {
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
  },
};
