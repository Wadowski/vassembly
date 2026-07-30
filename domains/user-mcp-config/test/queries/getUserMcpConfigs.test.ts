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

      expect(list.items).toHaveLength(2);
      expect(list.items.map((config) => config.mcpId)).toContain('mcp-gmail');
      expect(list.items.map((config) => config.mcpId)).toContain('mcp-brave');
      expect(list.total).toBe(2);
    });

    it('should return empty list when user has no configurations', async () => {
      const list = await getUserMcpConfigs({ userId: 'user-no-configs' });

      expect(list.items).toHaveLength(0);
      expect(list.total).toBe(0);
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

      expect(listA.items).toHaveLength(1);
      expect(listB.items).toHaveLength(1);
      expect(listA.items[0]?.fieldValues).not.toEqual(listB.items[0]?.fieldValues);
    });
  });

  describe('pagination', () => {
    it('should return paginated configurations for YOUR MCPs section', async () => {
      for (let index = 0; index < 12; index += 1) {
        await createUserMcpConfig({
          userId: mockUserId,
          mcpId: `mcp-${index}`,
          fieldValues: { someField: `value-${index}` },
          schema: mockSimpleTextSchema,
        });
      }

      const firstPage = await getUserMcpConfigs({ userId: mockUserId, page: 0, size: 5 });
      const secondPage = await getUserMcpConfigs({ userId: mockUserId, page: 1, size: 5 });

      expect(firstPage.items).toHaveLength(5);
      expect(secondPage.items).toHaveLength(5);
      expect(firstPage.total).toBe(12);
      expect(secondPage.total).toBe(12);
    });

    it('should cap page size at 50 items', async () => {
      for (let index = 0; index < 55; index += 1) {
        await createUserMcpConfig({
          userId: mockUserId,
          mcpId: `mcp-${index}`,
          fieldValues: { someField: `value-${index}` },
          schema: mockSimpleTextSchema,
        });
      }

      const list = await getUserMcpConfigs({ userId: mockUserId, page: 0, size: 100 });

      expect(list.items.length).toBeLessThanOrEqual(50);
      expect(list.size).toBe(50);
    });
  });
});
