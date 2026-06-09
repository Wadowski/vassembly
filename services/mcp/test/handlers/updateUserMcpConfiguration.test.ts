import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { updateUserMcpConfiguration } from '../../src/handlers/updateUserMcpConfiguration';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

describe('updateUserMcpConfiguration', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetHandlerTestStores();
  });

  describe('partial updates', () => {
    it('should update field when a new value is provided', async () => {
      await createUserMcpConfiguration(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'old-id', clientSecret: 'old-secret' },
        },
        mockContext,
      );

      const updated = await updateUserMcpConfiguration(
        { mcpId: mockMcpId, fieldValues: { clientId: 'new-id' } },
        mockContext,
      );

      const clientIdField = updated.fieldValues.find((fieldValue) => fieldValue.key === 'clientId');
      expect(clientIdField?.value).toBe('new-id');
    });

    it('should retain existing secret when password field is blank', async () => {
      await createUserMcpConfiguration(
        {
          mcpId: mockMcpId,
          fieldValues: { clientId: 'abc', clientSecret: 'original-secret' },
        },
        mockContext,
      );

      const updated = await updateUserMcpConfiguration(
        { mcpId: mockMcpId, fieldValues: { clientSecret: '' } },
        mockContext,
      );

      const secretField = updated.fieldValues.find((fieldValue) => fieldValue.key === 'clientSecret');
      expect(secretField?.hasSecret).toBe(true);
    });
  });

  describe('auth', () => {
    it('should reject update from a different user', async () => {
      await createUserMcpConfiguration(
        { mcpId: mockMcpId, fieldValues: { clientId: 'abc', clientSecret: 'secret' } },
        mockContext,
      );

      const differentUserContext: ServiceContext = { userId: 'user-999' };

      await expect(
        updateUserMcpConfiguration(
          { mcpId: mockMcpId, fieldValues: { clientId: 'hacked' } },
          differentUserContext,
        ),
      ).rejects.toThrow(/Unauthorized/i);
    });
  });
});
