import { describe, it, expect } from 'vitest';

import { braveSearchMcpRuntimeAdapter } from './brave-search-mcp';
import { googleWorkspaceMcpRuntimeAdapter } from './google-workspace-mcp';

describe('MCP runtime adapters', () => {
  it('should map brave search config to stdio server config', () => {
    const result = braveSearchMcpRuntimeAdapter.toServerConfig({
      mcpId: 'mcp-brave',
      fieldValues: { apiKey: 'brave-key' },
    });

    expect(result).toEqual({
      serverName: 'mcp-brave',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@brave/brave-search-mcp-server', '--transport', 'stdio'],
      env: { BRAVE_API_KEY: 'brave-key' },
    });
  });

  it('should map google workspace config to stdio server config', () => {
    const result = googleWorkspaceMcpRuntimeAdapter.toServerConfig({
      mcpId: 'mcp-google',
      fieldValues: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        scopes: 'full',
      },
    });

    expect(result).toEqual({
      serverName: 'mcp-google',
      transport: 'stdio',
      command: 'uvx',
      args: ['workspace-mcp', '--tool-tier', 'complete'],
      env: {
        GOOGLE_OAUTH_CLIENT_ID: 'client-id',
        GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
      },
    });
  });
});
