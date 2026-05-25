import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const MONGODB_ID = '507f1f77bcf86cd799439011';

const { mockCreate, mockGet, mockEncode } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGet: vi.fn(),
  mockEncode: vi.fn(),
}));

vi.mock('../../clients', () => ({
  aiIntegrationMongodbDao: {
    create: mockCreate,
    get: mockGet,
  },
}));

vi.mock('@vassembly/client-encoder', () => ({
  encode: mockEncode,
}));

import { create } from './index';

const BASE_INPUT = {
  userId: 'user-1',
  name: 'Personal Gemini',
  provider: 'gemini' as const,
  apiKey: 'sk-test-api-key-1234',
  model: 'gemini-pro',
};

describe('create ai integration command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEncode.mockReturnValue('encrypted-key-value-abcd');
    mockCreate.mockResolvedValue(MONGODB_ID);
    mockGet.mockResolvedValue({
      _id: MONGODB_ID,
      userId: 'user-1',
      name: 'Personal Gemini',
      provider: 'gemini',
      encryptedApiKey: 'encrypted-key-value-abcd',
      model: 'gemini-pro',
      status: 'active',
      connectionStatus: 'untested',
      removedAt: null,
      createdAt: new Date('2026-01-05T00:00:00.000Z'),
      updatedAt: new Date('2026-01-05T00:00:00.000Z'),
    });
  });

  it('should persist credential with encoded api key active status and untested connection', async () => {
    const result = await create(BASE_INPUT);

    expect(mockEncode).toHaveBeenCalledWith('sk-test-api-key-1234');
    expect(result.data.encryptedApiKey).toBe('encrypted-key-value-abcd');
    expect(result.data.status).toBe('active');
    expect(result.data.connectionStatus).toBe('untested');
    expect(result.data.model).toBe('gemini-pro');
    expect(result.data.userId).toBe('user-1');
  });

  it('should reject create when gemini provider is missing apiKey', async () => {
    await expect(
      create({
        userId: 'user-1',
        name: 'Missing Key',
        provider: 'gemini',
        model: 'gemini-pro',
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should reject create when model is missing', async () => {
    await expect(
      create({
        userId: 'user-1',
        name: 'Missing Model',
        provider: 'gemini',
        apiKey: 'sk-test-api-key-1234',
        model: '',
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should reject create when lm_studio provider is missing baseUrl', async () => {
    await expect(
      create({
        userId: 'user-1',
        name: 'Local LM',
        provider: 'lm_studio',
        model: 'local-model',
      }),
    ).rejects.toThrow(WrongParamError);
  });
});
