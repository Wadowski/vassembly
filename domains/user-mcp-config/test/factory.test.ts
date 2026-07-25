import { describe, it, expect } from 'vitest';

import { UserMcpConfigFactory } from '../src/model/factory';
import { UserMcpConfigModel } from '../src/model/model';
import type { CreateUserMcpConfigInput } from '../src/types';

describe('UserMcpConfigFactory', () => {
  it('creates model from DTO', () => {
    const input: CreateUserMcpConfigInput = {
      mcpId: 'mcp-789',
      fieldValues: { apiKey: 'secret' },
    };
    const model = UserMcpConfigFactory.fromDTO({ input, userId: 'user-123' });
    expect(model.mcpId).toBe('mcp-789');
    expect(model.userId).toBe('user-123');
    expect(model.enabled).toBe(true);
    expect(model.status).toBe('configured');
  });

  it('creates a new persistence-ready model with createNew', () => {
    const model = UserMcpConfigFactory.createNew({
      id: 'config-new',
      userId: 'user-123',
      mcpId: 'mcp-wikipedia',
      fieldValues: {},
      enabled: true,
    });

    expect(model.id).toBe('config-new');
    expect(model.enabled).toBe(true);
    expect(model.status).toBe('configured');
    expect(model.lastTestedAt).toBeInstanceOf(Date);
  });

  it('returns a copy with updated enabled state via withEnabled', () => {
    const source = UserMcpConfigFactory.createNew({
      id: 'config-1',
      userId: 'user-123',
      mcpId: 'mcp-brave',
      fieldValues: { apiKey: 'secret' },
      enabled: true,
    });

    const disabled = UserMcpConfigFactory.withEnabled({ model: source, enabled: false });

    expect(disabled.enabled).toBe(false);
    expect(disabled.id).toBe('config-1');
    expect(disabled.fieldValues).toEqual({ apiKey: 'secret' });
  });

  it('masks secrets in response DTO', () => {
    const model = new UserMcpConfigModel();
    model.id = 'config-1';
    model.userId = 'user-123';
    model.mcpId = 'mcp-789';
    model.fieldValues = { publicKey: 'visible', secretKey: 'hidden' };
    model.status = 'configured';

    const response = UserMcpConfigFactory.toDTO({
      model,
      configSchema: {
        fields: [
          { key: 'publicKey', label: 'Public Key', type: 'text' },
          { key: 'secretKey', label: 'Secret Key', type: 'password' },
        ],
      },
    });

    expect(response.id).toBe('config-1');
    expect(response.fieldValues).toEqual([
      { key: 'publicKey', value: 'visible' },
      { key: 'secretKey', hasSecret: true },
    ]);
  });
});
