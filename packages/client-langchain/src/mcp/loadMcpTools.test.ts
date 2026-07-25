import { vi, describe, it, expect, beforeEach } from 'vitest';

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
    mockGetTools.mockResolvedValue([{ name: 'search' }]);
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
    expect(result.tools).toEqual([{ name: 'search' }]);
    expect(result.toolNameToServerName.get('search')).toBe('brave-1');
    await result.close();
    expect(mockClose).toHaveBeenCalled();
  });
});
