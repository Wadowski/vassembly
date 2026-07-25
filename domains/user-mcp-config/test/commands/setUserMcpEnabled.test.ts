import { describe, it, expect, beforeEach } from 'vitest';

import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { createUserMcpConfig } from '../../src/commands/create';
import { setUserMcpEnabled } from '../../src/commands/setUserMcpEnabled';
import { getMcpUserStatuses } from '../../src/queries/getConfigurationStatuses';
import { mockBraveSchema, mockGmailSchema } from '../fixtures/mockSchema';
import { resetUserMcpConfigStore } from '../setupCommandTests';

const mockEmptySchema = { fields: [] };

describe('setUserMcpEnabled', () => {
  const mockUserId = 'user-123';
  const mockMcpId = 'mcp-brave';

  beforeEach(() => {
    resetUserMcpConfigStore();
  });

  it('should enable MCP with existing configuration', async () => {
    await createUserMcpConfig({
      userId: mockUserId,
      mcpId: mockMcpId,
      fieldValues: { apiKey: 'secret' },
      schema: mockBraveSchema,
    });

    const updated = await setUserMcpEnabled({
      userId: mockUserId,
      mcpId: mockMcpId,
      enabled: false,
      schema: mockBraveSchema,
    });

    expect(updated.enabled).toBe(false);

    const reenabled = await setUserMcpEnabled({
      userId: mockUserId,
      mcpId: mockMcpId,
      enabled: true,
      schema: mockBraveSchema,
    });

    expect(reenabled.enabled).toBe(true);
  });

  it('should create configuration when enabling MCP that does not require fields', async () => {
    const created = await setUserMcpEnabled({
      userId: mockUserId,
      mcpId: 'mcp-wikipedia',
      enabled: true,
      schema: mockEmptySchema,
    });

    expect(created.enabled).toBe(true);
    expect(created.fieldValues).toEqual({});
  });

  it('should reject enabling MCP that requires configuration when none exists', async () => {
    await expect(
      setUserMcpEnabled({
        userId: mockUserId,
        mcpId: mockMcpId,
        enabled: true,
        schema: mockBraveSchema,
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should reject disabling when configuration does not exist', async () => {
    await expect(
      setUserMcpEnabled({
        userId: mockUserId,
        mcpId: mockMcpId,
        enabled: false,
        schema: mockBraveSchema,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

describe('getMcpUserStatuses', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    resetUserMcpConfigStore();
  });

  it('should return pending and disabled when no configuration exists', async () => {
    const statuses = await getMcpUserStatuses({
      userId: mockUserId,
      mcpIds: ['mcp-brave'],
    });

    expect(statuses['mcp-brave']).toEqual({
      configurationStatus: 'pending',
      enabled: false,
    });
  });

  it('should return enabled false when configuration exists but is disabled', async () => {
    await createUserMcpConfig({
      userId: mockUserId,
      mcpId: 'mcp-gmail',
      fieldValues: { clientId: 'abc', clientSecret: 'secret', scopes: 'readonly' },
      schema: mockGmailSchema,
    });

    await setUserMcpEnabled({
      userId: mockUserId,
      mcpId: 'mcp-gmail',
      enabled: false,
      schema: mockGmailSchema,
    });

    const statuses = await getMcpUserStatuses({
      userId: mockUserId,
      mcpIds: ['mcp-gmail'],
    });

    expect(statuses['mcp-gmail']).toEqual({
      configurationStatus: 'configured',
      enabled: false,
    });
  });
});
