import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AiIntegrationConnectionStatus, AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import type { AiIntegrationCredentialModel } from '../../model';
import { getListByProvider } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetManyRaw } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
}));

vi.mock('../../clients', () => ({
  aiIntegrationMongodbDao: {
    getManyRaw: mockGetManyRaw,
  },
}));

const doc = (partial: Partial<AiIntegrationCredentialModel & { id: string }>): Partial<AiIntegrationCredentialModel> => ({
  id: partial.id ?? 'c1',
  name: partial.name ?? 'Gemini',
  provider: partial.provider ?? AiIntegrationProvider.Gemini,
  userId: partial.userId ?? 'user-1',
  status: partial.status ?? AiIntegrationStatus.Active,
  connectionStatus: partial.connectionStatus ?? AiIntegrationConnectionStatus.Connected,
  removedAt: partial.removedAt ?? null,
});

describe('getListByProvider ai integration query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return only active connected credentials for user and provider', async () => {
    mockGetManyRaw.mockResolvedValue([
      doc({
        id: 'c1',
        provider: AiIntegrationProvider.Gemini,
        status: AiIntegrationStatus.Active,
        connectionStatus: AiIntegrationConnectionStatus.Connected,
      }),
    ]);

    const result = await getListByProvider({ userId: 'user-1', provider: AiIntegrationProvider.Gemini });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe(AiIntegrationStatus.Active);
    expect(result.items[0]?.connectionStatus).toBe(AiIntegrationConnectionStatus.Connected);
    expect(result.items[0]?.provider).toBe(AiIntegrationProvider.Gemini);
  });
});
