import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCP_SLUG } from '@vassembly/constants';

const { mockTestMcpServerConnection } = vi.hoisted(() => ({
  mockTestMcpServerConnection: vi.fn(),
}));

vi.mock('../../src/clients/langchain', () => ({
  testMcpServerConnection: mockTestMcpServerConnection,
}));

import { testMcpConnection } from '../../src/commands/testMcpConnection';

describe('testMcpConnection', () => {
  const mockSchema = {
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password' as const, required: true }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTestMcpServerConnection.mockResolvedValue({ success: true });
  });

  it('should probe MCP server when configuration is valid', async () => {
    const result = await testMcpConnection({
      userId: 'user-123',
      mcpId: 'mcp-brave',
      fieldValues: { apiKey: 'brave-key' },
      schema: mockSchema,
      mcpSlug: MCP_SLUG.BraveSearchMcp,
      serverUrl: 'http://localhost:4109/mcp',
    });

    expect(result.success).toBe(true);
  });

  it('should return failure when MCP server probe fails', async () => {
    mockTestMcpServerConnection.mockResolvedValue({
      success: false,
      error: 'fetch failed',
    });

    const result = await testMcpConnection({
      userId: 'user-123',
      mcpId: 'mcp-brave',
      fieldValues: { apiKey: 'brave-key' },
      schema: mockSchema,
      mcpSlug: MCP_SLUG.BraveSearchMcp,
      serverUrl: 'http://localhost:4109/mcp',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('fetch failed');
  });

  it('should return failure when server URL is not configured', async () => {
    const result = await testMcpConnection({
      userId: 'user-123',
      mcpId: 'mcp-brave',
      fieldValues: { apiKey: 'brave-key' },
      schema: mockSchema,
      mcpSlug: MCP_SLUG.BraveSearchMcp,
      serverUrl: null,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('MCP server URL is not configured');
  });

  it('should reject missing required credentials', async () => {
    await expect(
      testMcpConnection({
        userId: 'user-123',
        mcpId: 'mcp-brave',
        fieldValues: { apiKey: '' },
        schema: mockSchema,
        mcpSlug: MCP_SLUG.BraveSearchMcp,
        serverUrl: 'http://localhost:4109/mcp',
      }),
    ).rejects.toThrow(/apiKey/i);
  });
});
