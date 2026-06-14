import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfig } from '../../src/commands/create';
import { updateUserMcpConfig } from '../../src/commands/update';
import { mockGmailSchema } from '../fixtures/mockSchema';
import { resetUserMcpConfigStore } from '../setupCommandTests';

describe('updateUserMcpConfig', () => {
  const mockUserId = 'user-123';
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetUserMcpConfigStore();
  });

  describe('partial updates', () => {
    it('should update non-secret fields when only clientId changes', async () => {
      await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientId: 'old-id', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      const updated = await updateUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientId: 'new-id' },
        schema: mockGmailSchema,
      });

      expect(updated.fieldValues.clientId).toBe('new-id');
    });

    it('should retain existing secret when password field is blank', async () => {
      const initial = await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientId: 'abc', clientSecret: 'original-secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      const originalSecret = initial.fieldValues.clientSecret;

      const updated = await updateUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientSecret: '' },
        schema: mockGmailSchema,
      });

      expect(updated.fieldValues.clientSecret).toBe(originalSecret);
    });

    it('should encrypt new secret when password field is provided', async () => {
      await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientId: 'abc', clientSecret: 'old-secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      const updated = await updateUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientSecret: 'new-secret' },
        schema: mockGmailSchema,
      });

      expect(updated.fieldValues.clientSecret).not.toBe('old-secret');
      expect(updated.fieldValues.clientSecret).not.toBe('new-secret');
    });
  });

  describe('not found', () => {
    it('should reject update when configuration does not exist', async () => {
      await expect(
        updateUserMcpConfig({
          userId: 'non-existent-user',
          mcpId: mockMcpId,
          fieldValues: { clientId: 'abc' },
          schema: mockGmailSchema,
        }),
      ).rejects.toThrow(/Configuration not found/i);
    });
  });

  describe('ownership', () => {
    it('should reject update from different user', async () => {
      await createUserMcpConfig({
        userId: 'user-123',
        mcpId: mockMcpId,
        fieldValues: { clientId: 'abc', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      await expect(
        updateUserMcpConfig({
          userId: 'different-user',
          mcpId: mockMcpId,
          fieldValues: { clientId: 'hacked' },
          schema: mockGmailSchema,
        }),
      ).rejects.toThrow(/Configuration not found/i);
    });
  });
});
