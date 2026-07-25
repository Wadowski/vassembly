import { describe, it, expect } from 'vitest';

import { getMcpRuntimeAdapter } from './index';

describe('MCP runtime adapters', () => {
  it('should map brave search config to HTTP server config with x-api-key header', () => {
    const adapter = getMcpRuntimeAdapter({ slug: 'brave-search-mcp' });
    const result = adapter.toServerConfig({
      mcpId: 'mcp-brave',
      fieldValues: { apiKey: 'brave-key' },
      serverUrl: 'http://localhost:4109/mcp',
    });

    expect(result).toEqual({
      serverName: 'mcp-brave',
      transport: 'http',
      url: 'http://localhost:4109/mcp',
      headers: { 'x-api-key': 'brave-key' },
    });
  });

  it('should map wikipedia config to HTTP server config without headers', () => {
    const adapter = getMcpRuntimeAdapter({ slug: 'wikipedia-mcp' });
    const result = adapter.toServerConfig({
      mcpId: 'mcp-wikipedia',
      fieldValues: {},
      serverUrl: 'http://localhost:4110/mcp',
    });

    expect(result).toEqual({
      serverName: 'mcp-wikipedia',
      transport: 'http',
      url: 'http://localhost:4110/mcp',
    });
  });

  it('should return null when serverUrl is missing', () => {
    const adapter = getMcpRuntimeAdapter({ slug: 'wikipedia-mcp' });
    const result = adapter.toServerConfig({
      mcpId: 'mcp-wikipedia',
      fieldValues: {},
      serverUrl: null,
    });

    expect(result).toBeNull();
  });
});
