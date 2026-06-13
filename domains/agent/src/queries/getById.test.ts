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

vi.mock('../clients', () => ({
  agentMongodbDao: {
    get: mockGet,
  },
}));

import type { AgentModel } from '../model';
import { AgentCategory, AgentStatus } from '../model';
import { getById } from './getById';

const AGENT_ID = '507f1f77bcf86cd799439011';

const buildAgentDoc = (overrides: Partial<AgentModel & { _id: string }> = {}): AgentModel & { _id: string } => ({
  _id: AGENT_ID,
  id: AGENT_ID,
  name: 'Agent',
  category: AgentCategory.Coding,
  description: 'Desc',
  rule: 'Rule text',
  userId: 'user-1',
  status: AgentStatus.Active,
  removedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
} as AgentModel & { _id: string });

describe('getById agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return owned agent when identifier matches requesting user', async () => {
    mockGet.mockResolvedValue(buildAgentDoc());

    const result = await getById({ id: AGENT_ID, userId: 'user-1' });

    expect(result.data.id).toBe(AGENT_ID);
    expect(result.data.userId).toBe('user-1');
  });

  it('should treat missing rows as not found', async () => {
    mockGet.mockResolvedValue(undefined);

    await expect(getById({ id: AGENT_ID, userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });

  it('should treat cross-tenant rows as not found when userId filter supplied', async () => {
    mockGet.mockResolvedValue(buildAgentDoc({ userId: 'user-2' }));

    await expect(getById({ id: AGENT_ID, userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });

  it('should expose archived agents when explicitly fetched by identifier', async () => {
    mockGet.mockResolvedValue(
      buildAgentDoc({
        status: AgentStatus.Archived,
        removedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    );

    const result = await getById({ id: AGENT_ID, userId: 'user-1' });

    expect(result.data.status).toBe('archived');
    expect(result.data.removedAt).toBe('2026-02-01T00:00:00.000Z');
  });
});
