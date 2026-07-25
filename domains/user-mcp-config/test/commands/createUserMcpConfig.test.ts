import { describe, it, expect, beforeEach } from 'vitest';

import { decode } from '@vassembly/client-encoder';

import { createUserMcpConfig } from '../../src/commands/create';
import { validateFieldValues } from '../../src/commands/shared/validateFieldValues';
import { mockGmailSchema } from '../fixtures/mockSchema';
import { resetUserMcpConfigStore } from '../setupCommandTests';

describe('createUserMcpConfig', () => {
  const mockUserId = 'user-123';
  const mockMcpId = 'mcp-gmail';

  beforeEach(() => {
    resetUserMcpConfigStore();
  });

  describe('validation', () => {
    it('should reject missing required field when clientSecret is omitted', () => {
      const invalidFieldValues = { clientId: 'abc' };

      expect(() =>
        validateFieldValues({ schema: mockGmailSchema, values: invalidFieldValues }),
      ).toThrow(/clientSecret.*required/i);
    });

    it('should accept valid field values when all required fields are provided', () => {
      const validFieldValues = {
        clientId: 'abc123',
        clientSecret: 'secret456',
        scopes: 'readonly',
      };

      expect(() =>
        validateFieldValues({ schema: mockGmailSchema, values: validFieldValues }),
      ).not.toThrow();
    });

    it('should reject invalid enum value when select option is not allowed', () => {
      const invalidFieldValues = {
        clientId: 'abc123',
        clientSecret: 'secret456',
        scopes: 'invalid-scope',
      };

      expect(() =>
        validateFieldValues({ schema: mockGmailSchema, values: invalidFieldValues }),
      ).toThrow(/scopes.*one of/i);
    });
  });

  describe('encryption', () => {
    it('should encrypt password-type fields when configuration is created', async () => {
      const fieldValues = {
        clientId: 'visible-value',
        clientSecret: 'secret-to-encrypt',
        scopes: 'readonly',
      };

      const created = await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues,
        schema: mockGmailSchema,
      });

      expect(created.fieldValues.clientSecret).not.toBe('secret-to-encrypt');
      expect(created.fieldValues.clientId).toBe('visible-value');
    });

    it('should store encrypted secret that can be decrypted back to original value', async () => {
      const fieldValues = {
        clientId: 'abc',
        clientSecret: 'original-secret',
        scopes: 'readonly',
      };

      const created = await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues,
        schema: mockGmailSchema,
      });

      const decrypted = decode(String(created.fieldValues.clientSecret));
      expect(decrypted).toBe('original-secret');
    });
  });

  describe('persistence', () => {
    it('should save configuration scoped to userId and mcpId', async () => {
      const fieldValues = {
        clientId: 'abc',
        clientSecret: 'secret',
        scopes: 'readonly',
      };

      const created = await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues,
        schema: mockGmailSchema,
      });

      expect(created.id).toBeDefined();
      expect(created.userId).toBe(mockUserId);
      expect(created.mcpId).toBe(mockMcpId);
      expect(created.status).toBe('configured');
      expect(created.enabled).toBe(true);
      expect(created.createdAt).toBeDefined();
    });

    it('should reject duplicate userId and mcpId pair when configuration already exists', async () => {
      const fieldValues = {
        clientId: 'abc',
        clientSecret: 'secret',
        scopes: 'readonly',
      };

      await createUserMcpConfig({
        userId: mockUserId,
        mcpId: mockMcpId,
        fieldValues,
        schema: mockGmailSchema,
      });

      await expect(
        createUserMcpConfig({
          userId: mockUserId,
          mcpId: mockMcpId,
          fieldValues,
          schema: mockGmailSchema,
        }),
      ).rejects.toThrow(/Configuration already exists for this MCP/i);
    });
  });

  describe('error handling', () => {
    it('should throw descriptive error when schema validation fails on create', async () => {
      await expect(
        createUserMcpConfig({
          userId: mockUserId,
          mcpId: mockMcpId,
          fieldValues: { clientId: 'abc' },
          schema: mockGmailSchema,
        }),
      ).rejects.toThrow(/clientSecret.*required/i);
    });
  });
});
