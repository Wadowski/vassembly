import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { testMcpConnection } from '../../src/handlers/testMcpConnection';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

describe('testMcpConnection', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetHandlerTestStores();
  });

  describe('test connection', () => {
    it('should return success when connection credentials are valid', async () => {
      const result = await testMcpConnection(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'valid-id', clientSecret: 'valid-secret' },
        },
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when connection credentials are invalid', async () => {
      const result = await testMcpConnection(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'invalid-id', clientSecret: 'invalid-secret' },
        },
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('useSavedSecrets merge', () => {
    it('should merge blank passwords with saved config when useSavedSecrets is true', async () => {
      await createUserMcpConfiguration(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'original-id', clientSecret: 'original-secret' },
        },
        mockContext,
      );

      const result = await testMcpConnection(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'valid-id', clientSecret: '' },
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
            fieldValues: { clientId: '', clientSecret: '' },
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
            fieldValues: { clientId: 'abc', clientSecret: 'secret' },
          },
          differentUserContext,
        ),
      ).rejects.toThrow(/Unauthorized/i);
    });
  });
});
