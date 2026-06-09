import { describe, it, expect } from 'vitest';

import { UserMcpConfigModel } from '../src/model/model';

describe('UserMcpConfigModel', () => {
  it('creates model with required fields', () => {
    const model = new UserMcpConfigModel();
    model.userId = 'user-123';
    model.mcpId = 'mcp-456';
    model.fieldValues = { clientId: 'abc', clientSecret: 'xyz' };
    model.status = 'configured';

    expect(model.userId).toBe('user-123');
    expect(model.mcpId).toBe('mcp-456');
    expect(model.fieldValues.clientId).toBe('abc');
  });

  it('preserves timestamps', () => {
    const model = new UserMcpConfigModel();
    const now = new Date();
    model.createdAt = now;
    expect(model.createdAt).toEqual(now);
  });
});
