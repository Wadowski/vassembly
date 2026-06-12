import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { deleteUserMcpConfiguration } from '../../src/handlers/deleteUserMcpConfiguration';
import { getUserMcpConfiguration } from '../../src/handlers/getUserMcpConfiguration';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

describe('deleteUserMcpConfiguration', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetHandlerTestStores();
  });

  describe('deletion', () => {
    it('should delete configuration when config exists for user', async () => {
      await createUserMcpConfiguration(
        { mcpId: mockMcpId, fieldValues: { clientId: 'abc', clientSecret: 'secret' } },
        mockContext,
      );

      const result = await deleteUserMcpConfiguration({ mcpId: mockMcpId }, mockContext);

      expect(result.success).toBe(true);

      const fetched = await getUserMcpConfiguration({ mcpId: mockMcpId }, mockContext);
      expect(fetched).toBeNull();
    });
  });

  describe('auth', () => {
    it('should not delete another user configuration when a different user attempts delete', async () => {
      await createUserMcpConfiguration(
        { mcpId: mockMcpId, fieldValues: { clientId: 'abc', clientSecret: 'secret' } },
        mockContext,
      );

      const differentUserContext: ServiceContext = { userId: 'user-999' };

      const result = await deleteUserMcpConfiguration({ mcpId: mockMcpId }, differentUserContext);

      expect(result.success).toBe(true);

      const ownerConfig = await getUserMcpConfiguration({ mcpId: mockMcpId }, mockContext);
      expect(ownerConfig).not.toBeNull();
    });
  });
});
