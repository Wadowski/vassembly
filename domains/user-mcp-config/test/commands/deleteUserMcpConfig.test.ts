import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfig } from '../../src/commands/create';
import { deleteUserMcpConfig } from '../../src/commands/delete';
import { getUserMcpConfig } from '../../src/queries/getUserMcpConfig';
import { mockGmailSchema } from '../fixtures/mockSchema';
import { resetUserMcpConfigStore } from '../setupCommandTests';

describe('deleteUserMcpConfig', () => {
  const mockUserId = 'user-123';
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetUserMcpConfigStore();
  });

  describe('deletion', () => {
    it('should hard delete configuration when it exists', async () => {
      await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues: { clientId: 'abc', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      const deleted = await deleteUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
      });

      expect(deleted.success).toBe(true);

      const fetched = await getUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
      });
      expect(fetched).toBeNull();
    });
  });

  describe('not found', () => {
    it('should return success when configuration does not exist', async () => {
      const deleted = await deleteUserMcpConfig({
        userId: 'user-xyz',
        mcpId: 'mcp-nonexistent',
      });

      expect(deleted.success).toBe(true);
    });
  });

  describe('ownership', () => {
    it('should reject delete from different user', async () => {
      await createUserMcpConfig({
        userId: 'user-123',
        mcpId: mockMcpId,
        fieldValues: { clientId: 'abc', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      await expect(
        deleteUserMcpConfig({
          userId: 'different-user',
          mcpId: mockMcpId,
        }),
      ).rejects.toThrow(/Unauthorized/i);
    });
  });
});
