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
    it('should return all configs for the current user', async () => {
      await createUserMcpConfiguration(
        { mcpId: 'mcp-gmail', fieldValues: { clientId: 'a', clientSecret: 'secret' } },
        mockContext,
      );

      await createUserMcpConfiguration(
        { mcpId: 'mcp-brave', fieldValues: { apiKey: 'key' } },
        mockContext,
      );

      const result = await listUserMcpConfigurations({}, mockContext);

      expect(result).toHaveLength(2);
      expect(result.map((config) => config.mcpId)).toContain('mcp-gmail');
      expect(result.map((config) => config.mcpId)).toContain('mcp-brave');
    });

    it('should return empty list when user has no configs', async () => {
      const result = await listUserMcpConfigurations({}, mockContext);

      expect(result).toHaveLength(0);
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

      expect(resultA).toHaveLength(1);
      expect(resultB).toHaveLength(1);
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

      expect(result[0]?.mcpId).toBe('mcp-brave');
      expect(result[1]?.mcpId).toBe('mcp-gmail');
    });
  });
});
