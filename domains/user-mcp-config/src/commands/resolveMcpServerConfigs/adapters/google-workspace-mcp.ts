import type { McpRuntimeAdapter } from './types';

const readOptionalString = (value: string | boolean | undefined): string | undefined => {
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }

  return value;
};

const resolveToolTier = (scopes: string | boolean | undefined): string => {
  if (scopes === 'full') {
    return 'complete';
  }

  return 'core';
};

export const googleWorkspaceMcpRuntimeAdapter: McpRuntimeAdapter = {
  toServerConfig: ({ mcpId, fieldValues }) => {
    const clientId = readOptionalString(fieldValues.clientId);
    const clientSecret = readOptionalString(fieldValues.clientSecret);

    if (!clientId || !clientSecret) {
      return null;
    }

    return {
      serverName: mcpId,
      transport: 'stdio',
      command: 'uvx',
      args: ['workspace-mcp', '--tool-tier', resolveToolTier(fieldValues.scopes)],
      env: {
        GOOGLE_OAUTH_CLIENT_ID: clientId,
        GOOGLE_OAUTH_CLIENT_SECRET: clientSecret,
      },
    };
  },
};
