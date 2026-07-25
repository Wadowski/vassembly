import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetTools, mockClose, mockMultiServerMCPClient } = vi.hoisted(() => {
  const mockGetTools = vi.fn();
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockMultiServerMCPClient = vi.fn(() => ({
    getTools: mockGetTools,
    close: mockClose,
  }));

  return { mockGetTools, mockClose, mockMultiServerMCPClient };
});

vi.mock('@langchain/mcp-adapters', () => ({
  MultiServerMCPClient: mockMultiServerMCPClient,
}));

import { testMcpConnection } from './testMcpConnection';

describe('testMcpConnection', () => {
  const serverConfig = {
    serverName: 'mcp-brave',
    transport: 'http' as const,
    url: 'http://localhost:4109/mcp',
    headers: { 'x-api-key': 'test-key' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTools.mockResolvedValue([]);
    mockClose.mockResolvedValue(undefined);
  });

  it('should return success when MCP server responds', async () => {
    const result = await testMcpConnection({ serverConfig });

    expect(result).toEqual({ success: true });
  });

  it('should return failure when MCP server is unreachable', async () => {
    mockGetTools.mockRejectedValue(new Error('fetch failed'));

    const result = await testMcpConnection({ serverConfig });

    expect(result.success).toBe(false);
    expect(result.error).toBe('fetch failed');
  });

  it('should return failure when connection times out', async () => {
    mockGetTools.mockImplementation(
      () =>
        new Promise(() => {
          // never resolves
        }),
    );

    const result = await testMcpConnection({ serverConfig, timeoutMs: 50 });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/timed out/i);
  });
});
