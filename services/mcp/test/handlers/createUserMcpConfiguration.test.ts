import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

describe('createUserMcpConfiguration', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetHandlerTestStores();
  });

  describe('creation', () => {
    it('should create config with valid fieldValues when all required fields are provided', async () => {
      const result = await createUserMcpConfiguration(
        { mcpId: mockMcpId, fieldValues: { clientId: 'abc', clientSecret: 'secret' } },
        mockContext,
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.mcpId).toBe(mockMcpId);
      expect(result.status).toBe('configured');
    });

    it('should reject missing required field when password field is omitted', async () => {
      await expect(
        createUserMcpConfiguration(
          { mcpId: mockMcpId, fieldValues: { clientId: 'abc' } },
          mockContext,
        ),
      ).rejects.toThrow(/required/i);
    });
  });

  describe('auth', () => {
    it('should throw UnauthorizedError when userId is missing from context', async () => {
      const noUserContext = { userId: undefined } as unknown as ServiceContext;

      await expect(
        createUserMcpConfiguration(
          { mcpId: mockMcpId, fieldValues: { clientId: 'abc', clientSecret: 'secret' } },
          noUserContext,
        ),
      ).rejects.toThrow(/Unauthorized/i);
    });
  });

  describe('secrets', () => {
    it('should return masked DTO without plaintext secrets when password fields are saved', async () => {
      const result = await createUserMcpConfiguration(
        { mcpId: mockMcpId, fieldValues: { clientId: 'visible', clientSecret: 'secret' } },
        mockContext,
      );

      const fieldValues = result.fieldValues;
      expect(fieldValues.some((fieldValue) => fieldValue.key === 'clientSecret' && fieldValue.hasSecret)).toBe(
        true,
      );
      expect(fieldValues.every((fieldValue) => fieldValue.value !== 'secret')).toBe(true);
    });
  });
});
