import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { getUserMcpConfiguration } from '../../src/handlers/getUserMcpConfiguration';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

describe('getUserMcpConfiguration', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetHandlerTestStores();
  });

  describe('retrieval', () => {
    it('should return masked config when configuration exists', async () => {
      await createUserMcpConfiguration(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'visible-value', clientSecret: 'secret-value' },
        },
        mockContext,
      );

      const result = await getUserMcpConfiguration({ mcpId: mockMcpId }, mockContext);

      expect(result).not.toBeNull();
      expect(result?.fieldValues).toBeDefined();

      const secretField = result?.fieldValues.find((fieldValue) => fieldValue.key === 'clientSecret');
      expect(secretField?.hasSecret).toBe(true);
      expect(secretField?.value).toBeUndefined();
    });

    it('should return null when MCP is not configured', async () => {
      const result = await getUserMcpConfiguration({ mcpId: 'mcp-nonexistent' }, mockContext);

      expect(result).toBeNull();
    });
  });

  describe('user isolation', () => {
    it('should not return another user configuration', async () => {
      const userAContext: ServiceContext = { userId: 'user-a' };
      await createUserMcpConfiguration(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'user-a-value', clientSecret: 'secret' },
        },
        userAContext,
      );

      const userBContext: ServiceContext = { userId: 'user-b' };
      const result = await getUserMcpConfiguration({ mcpId: mockMcpId }, userBContext);

      expect(result).toBeNull();
    });
  });
});
