import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfig } from '../../src/commands/create';
import { getUserMcpConfig } from '../../src/queries/getUserMcpConfig';
import { mockGmailSchema } from '../fixtures/mockSchema';
import { resetUserMcpConfigStore } from '../setupCommandTests';

describe('getUserMcpConfig', () => {
  const mockUserId = 'user-123';
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetUserMcpConfigStore();
  });

  describe('retrieval', () => {
    it('should return configuration with masked secrets when config exists', async () => {
      await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientId: 'visible', clientSecret: 'secret-value', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      const retrieved = await getUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
      });

      expect(retrieved?.fieldValues).toContainEqual({
        key: 'clientId',
        value: 'visible',
      });
      expect(retrieved?.fieldValues).toContainEqual({
        key: 'clientSecret',
        hasSecret: true,
      });
    });

    it('should return null when configuration does not exist', async () => {
      const retrieved = await getUserMcpConfig({
        userId: 'user-nonexistent',
        mcpId: mockMcpId,
      });

      expect(retrieved).toBeNull();
    });
  });

  describe('user isolation', () => {
    it('should not return another user configuration', async () => {
      await createUserMcpConfig({
        userId: 'user-a',
        mcpId: mockMcpId,
        fieldValues: { clientId: 'user-a-value', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      const retrieved = await getUserMcpConfig({
        userId: 'user-b',
        mcpId: mockMcpId,
      });

      expect(retrieved).toBeNull();
    });
  });
});
