import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfig } from '../../src/commands/create';
import { getUserMcpConfigs } from '../../src/queries/getUserMcpConfigs';
import { mockBraveSchema, mockGmailSchema, mockSimpleTextSchema } from '../fixtures/mockSchema';
import { resetUserMcpConfigStore } from '../setupCommandTests';

describe('getUserMcpConfigs', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    resetUserMcpConfigStore();
  });

  describe('list', () => {
    it('should return all configurations for user when multiple MCPs are configured', async () => {
      await createUserMcpConfig({
        userId: mockUserId,
        mcpId: 'mcp-gmail',
        fieldValues: { clientId: 'abc', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      await createUserMcpConfig({
        userId: mockUserId,
        mcpId: 'mcp-brave',
        fieldValues: { apiKey: 'key123' },
        schema: mockBraveSchema,
      });

      const list = await getUserMcpConfigs({ userId: mockUserId });

      expect(list).toHaveLength(2);
      expect(list.map((config) => config.mcpId)).toContain('mcp-gmail');
      expect(list.map((config) => config.mcpId)).toContain('mcp-brave');
    });

    it('should return empty list when user has no configurations', async () => {
      const list = await getUserMcpConfigs({ userId: 'user-no-configs' });

      expect(list).toHaveLength(0);
    });

    it('should return only configurations belonging to requested user', async () => {
      await createUserMcpConfig({
        userId: 'user-a',
        mcpId: 'mcp-gmail',
        fieldValues: { clientId: 'a', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      await createUserMcpConfig({
        userId: 'user-b',
        mcpId: 'mcp-gmail',
        fieldValues: { clientId: 'b', clientSecret: 'secret', scopes: 'readonly' },
        schema: mockGmailSchema,
      });

      const listA = await getUserMcpConfigs({ userId: 'user-a' });
      const listB = await getUserMcpConfigs({ userId: 'user-b' });

      expect(listA).toHaveLength(1);
      expect(listB).toHaveLength(1);
      expect(listA[0]?.fieldValues).not.toEqual(listB[0]?.fieldValues);
    });
  });

  describe('capping', () => {
    it('should cap list at 50 items for YOUR MCPs section', async () => {
      for (let index = 0; index < 55; index += 1) {
        await createUserMcpConfig({
          userId: mockUserId,
          mcpId: `mcp-${index}`,
          fieldValues: { someField: `value-${index}` },
          schema: mockSimpleTextSchema,
        });
      }

      const list = await getUserMcpConfigs({ userId: mockUserId });

      expect(list.length).toBeLessThanOrEqual(50);
    });
  });
});
