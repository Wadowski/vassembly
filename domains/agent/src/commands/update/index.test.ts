import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';
import { AgentCategory } from '../../model';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockUpdateDb } = vi.hoisted(() => ({
  mockUpdateDb: vi.fn(),
}));

vi.mock('../../clients', () => ({
  agentMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDb: vi.fn(() => mockUpdateDb),
}));

import { update } from './index';

describe('update agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply partial field changes while preserving immutable identifiers', async () => {
    const updatedAt = new Date('2026-03-01T00:00:00.000Z');
    mockUpdateDb.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Renamed',
        category: 'utility',
        description: 'Still helpful',
        rule: 'Still concise',
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt,
      },
    });

    const result = await update({
      id: 'agent-1',
      data: { name: 'Renamed', category: AgentCategory.Utility },
    });

    expect(result.data.userId).toBe('user-1');
    expect(result.data.id).toBe('agent-1');
    expect(result.data.name).toBe('Renamed');
    expect(result.data.updatedAt).toEqual(updatedAt);
  });

  it('should reject update payloads whose strings violate maximum lengths', async () => {
    await expect(
      update({
        id: 'agent-1',
        data: { name: 'x'.repeat(101) },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject update payloads with invalid category enum', async () => {
    await expect(
      update({
        id: 'agent-1',
        data: { category: AgentCategory.Coding },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject attempts to mutate identifiers via patch payloads', async () => {
    await expect(
      update({
        id: 'agent-1',
        data: { userId: 'another-user' } as never,
      }),
    ).rejects.toThrow(ValidationError);
  });
});
