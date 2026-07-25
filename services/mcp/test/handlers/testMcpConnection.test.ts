import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testMcpConnection as mockClientTestMcpConnection } from '@vassembly/client-langchain';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { testMcpConnection } from '../../src/handlers/testMcpConnection';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

describe('testMcpConnection', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };
  const mockMcpId = 'mcp-brave';

  beforeEach(() => {
    resetHandlerTestStores();
    vi.mocked(mockClientTestMcpConnection).mockReset();
  });

  describe('test connection', () => {
    it('should return success when MCP server is reachable', async () => {
      vi.mocked(mockClientTestMcpConnection).mockResolvedValue({ success: true });

      const result = await testMcpConnection(
        {
          mcpId: mockMcpId,
          fieldValues: { apiKey: 'valid-key' },
        },
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when MCP server is unreachable', async () => {
      vi.mocked(mockClientTestMcpConnection).mockResolvedValue({
        success: false,
        error: 'fetch failed',
      });

      const result = await testMcpConnection(
        {
          mcpId: mockMcpId,
          fieldValues: { apiKey: 'valid-key' },
        },
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('fetch failed');
    });
  });

  describe('useSavedSecrets merge', () => {
    it('should merge blank passwords with saved config when useSavedSecrets is true', async () => {
      vi.mocked(mockClientTestMcpConnection).mockResolvedValue({ success: true });

      await createUserMcpConfiguration(
        {
          mcpId: mockMcpId,
          fieldValues: { apiKey: 'original-key' },
        },
        mockContext,
      );

      const result = await testMcpConnection(
        {
          mcpId: mockMcpId,
          fieldValues: { apiKey: '' },
          useSavedSecrets: true,
        },
        mockContext,
      );

      expect(result.success).toBe(true);
    });

    it('should validate against schema even when useSavedSecrets is true', async () => {
      await expect(
        testMcpConnection(
          {
            mcpId: mockMcpId,
            fieldValues: { apiKey: '' },
            useSavedSecrets: true,
          },
          mockContext,
        ),
      ).rejects.toThrow(/required/i);
    });
  });

  describe('auth', () => {
    it('should reject test from an unauthorized user', async () => {
      const differentUserContext: ServiceContext = { userId: 'user-999' };

      await expect(
        testMcpConnection(
          {
            mcpId: mockMcpId,
            fieldValues: { apiKey: 'abc' },
          },
          differentUserContext,
        ),
      ).rejects.toThrow(/Unauthorized/i);
    });
  });
});
