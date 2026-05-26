import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('../../clients', () => ({
  aiIntegrationMongodbDao: {
    get: mockGet,
  },
}));

import type { AiIntegrationCredentialModel } from '../../model';
import { getById } from './index';

const CREDENTIAL_ID = '507f1f77bcf86cd799439011';

const buildCredentialDoc = (
  overrides: Partial<AiIntegrationCredentialModel & { _id: string }> = {},
): AiIntegrationCredentialModel & { _id: string } => ({
  _id: CREDENTIAL_ID,
  id: CREDENTIAL_ID,
  name: 'Gemini',
  provider: 'gemini',
  encryptedApiKey: 'encrypted-key-abcd',
  userId: 'user-1',
  status: 'active',
  connectionStatus: 'connected',
  removedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
});

describe('getById ai integration query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return owned credential when identifier matches requesting user', async () => {
    mockGet.mockResolvedValue(buildCredentialDoc());

    const result = await getById({ id: CREDENTIAL_ID, userId: 'user-1' });

    expect(result.data.id).toBe(CREDENTIAL_ID);
    expect(result.data.userId).toBe('user-1');
    expect(result.data.hasApiKey).toBe(true);
    expect(result.data.apiKeyHint).toBe('...abcd');
    expect('encryptedApiKey' in result.data).toBe(false);
  });

  it('should treat missing rows as not found', async () => {
    mockGet.mockResolvedValue(undefined);

    await expect(getById({ id: CREDENTIAL_ID, userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });

  it('should treat cross-tenant rows as not found', async () => {
    mockGet.mockResolvedValue(buildCredentialDoc({ userId: 'user-2' }));

    await expect(getById({ id: CREDENTIAL_ID, userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });
});
