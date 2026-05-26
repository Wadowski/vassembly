import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockUpdate, mockGetById, mockEncode } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockGetById: vi.fn(),
  mockEncode: vi.fn(),
}));

vi.mock('../../clients', () => ({
  aiIntegrationMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDbById: vi.fn(() => mockUpdate),
}));

vi.mock('../../queries', () => ({
  getModelById: mockGetById,
}));

vi.mock('@vassembly/client-encoder', () => ({
  encode: mockEncode,
}));

import { update } from './index';

describe('update ai integration command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEncode.mockReturnValue('new-encrypted-key-wxyz');
    mockGetById.mockResolvedValue({
      data: {
        id: 'cred-1',
        userId: 'user-1',
        name: 'Gemini',
        provider: 'gemini',
        encryptedApiKey: 'old-encrypted-key',
        baseUrl: null,
        organizationId: null,
        status: 'active',
        connectionStatus: 'connected',
      },
    });
    mockUpdate.mockResolvedValue({
      data: {
        id: 'cred-1',
        userId: 'user-1',
        encryptedApiKey: 'new-encrypted-key-wxyz',
        connectionStatus: 'untested',
      },
    });
  });

  it('should re-encode api key and reset connection status when key changes', async () => {
    const result = await update({
      userId: 'user-1',
      id: 'cred-1',
      data: { apiKey: 'sk-new-key-5678' },
    });

    expect(mockGetById).toHaveBeenCalledWith({ id: 'cred-1', userId: 'user-1' });
    expect(mockEncode).toHaveBeenCalledWith('sk-new-key-5678');
    expect(mockUpdate).toHaveBeenCalledWith({
      id: 'cred-1',
      data: {
        encryptedApiKey: 'new-encrypted-key-wxyz',
        connectionStatus: 'untested',
      },
    });
    expect(result.data.connectionStatus).toBe('untested');
  });

  it('should update model without resetting connection status', async () => {
    await update({
      userId: 'user-1',
      id: 'cred-1',
      data: { model: 'gemini-pro' },
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 'cred-1',
      data: {
        model: 'gemini-pro',
      },
    });
  });
});
