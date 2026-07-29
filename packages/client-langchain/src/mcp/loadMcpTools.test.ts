import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetTools, mockClose, MockMultiServerMCPClient } = vi.hoisted(() => {
  const mockGetTools = vi.fn();
  const mockClose = vi.fn();
  const MockMultiServerMCPClient = vi.fn().mockImplementation(() => ({
    getTools: mockGetTools,
    close: mockClose,
  }));

  return { mockGetTools, mockClose, MockMultiServerMCPClient };
});

vi.mock('@langchain/mcp-adapters', () => ({
  MultiServerMCPClient: MockMultiServerMCPClient,
}));

import { loadMcpTools } from './loadMcpTools';

describe('loadMcpTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTools.mockResolvedValue([{ name: 'search', description: 'Search the web' }]);
    mockClose.mockResolvedValue(undefined);
  });

  it('should load tools and return close handler', async () => {
    const result = await loadMcpTools({
      serverConfigs: [
        {
          serverName: 'brave-1',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@brave/brave-search-mcp-server'],
          env: { BRAVE_API_KEY: 'test-key' },
        },
      ],
    });

    expect(MockMultiServerMCPClient).toHaveBeenCalledWith({
      mcpServers: {
        'brave-1': {
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@brave/brave-search-mcp-server'],
          env: { BRAVE_API_KEY: 'test-key' },
        },
      },
      throwOnLoadError: false,
    });
    expect(result.tools).toEqual([{ name: 'search', description: 'Search the web' }]);
    expect(result.toolNameToServerName.get('search')).toBe('brave-1');
    expect(result.toolNameToOriginalName.get('search')).toBe('search');
    await result.close();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should capture original tool name from prefixed MCP tool names', async () => {
    mockGetTools.mockResolvedValue([
      { name: 'mcp__wiki-id__list_registries', description: 'List registries' },
    ]);

    const result = await loadMcpTools({
      serverConfigs: [
        {
          serverName: 'wiki-id',
          transport: 'http',
          url: 'http://localhost:4110/mcp',
        },
      ],
    });

    expect(result.toolNameToOriginalName.get('mcp__wiki-id__list_registries')).toBe(
      'list_registries',
    );
  });

  it('should prefix tool descriptions with the MCP label when provided', async () => {
    const result = await loadMcpTools({
      serverConfigs: [
        {
          serverName: 'notion-id',
          transport: 'http',
          url: 'http://localhost:4111/mcp',
          label: 'notion-mcp',
        },
      ],
    });

    expect(result.tools[0]?.description).toBe('[notion-mcp] Search the web');
  });
});
