import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { listUserMcpConfigurations } from '../../src/handlers/listUserMcpConfigurations';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

describe('listUserMcpConfigurations', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };

  beforeEach(() => {
    resetHandlerTestStores();
  });

  describe('list', () => {
    it('should return enriched MCP details for configured MCPs', async () => {
      await createUserMcpConfiguration(
        { mcpId: 'mcp-gmail', fieldValues: { clientId: 'a', clientSecret: 'secret' } },
        mockContext,
      );

      await createUserMcpConfiguration(
        { mcpId: 'mcp-brave', fieldValues: { apiKey: 'key' } },
        mockContext,
      );

      const result = await listUserMcpConfigurations({}, mockContext);

      expect(result.items).toHaveLength(2);
      expect(result.items.map((mcp) => mcp.id)).toContain('mcp-gmail');
      expect(result.items.map((mcp) => mcp.id)).toContain('mcp-brave');
      expect(result.items[0]?.name).toBeDefined();
      expect(result.items[0]?.configurationStatus).toBe('configured');
    });

    it('should return empty list when user has no configs', async () => {
      const result = await listUserMcpConfigurations({}, mockContext);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return only the current user configs', async () => {
      const userAContext: ServiceContext = { userId: 'user-a' };
      const userBContext: ServiceContext = { userId: 'user-b' };

      await createUserMcpConfiguration(
        { mcpId: 'mcp-gmail', fieldValues: { clientId: 'a', clientSecret: 'secret' } },
        userAContext,
      );

      await createUserMcpConfiguration(
        { mcpId: 'mcp-gmail', fieldValues: { clientId: 'b', clientSecret: 'secret' } },
        userBContext,
      );

      const resultA = await listUserMcpConfigurations({}, userAContext);
      const resultB = await listUserMcpConfigurations({}, userBContext);

      expect(resultA.items).toHaveLength(1);
      expect(resultB.items).toHaveLength(1);
    });

    it('should sort by updatedAt descending', async () => {
      await createUserMcpConfiguration(
        { mcpId: 'mcp-gmail', fieldValues: { clientId: 'a', clientSecret: 'secret' } },
        mockContext,
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      await createUserMcpConfiguration(
        { mcpId: 'mcp-brave', fieldValues: { apiKey: 'key' } },
        mockContext,
      );

      const result = await listUserMcpConfigurations({}, mockContext);

      expect(result.items[0]?.id).toBe('mcp-brave');
      expect(result.items[1]?.id).toBe('mcp-gmail');
    });
  });
});
