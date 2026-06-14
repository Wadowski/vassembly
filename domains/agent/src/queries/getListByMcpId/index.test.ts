import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

import { AgentCategory, AgentStatus, type AgentModel } from '../../model';
import { getListByMcpId } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetManyRaw, mockCountDocuments } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
  mockCountDocuments: vi.fn(),
}));

vi.mock('../../clients', () => ({
  agentMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

const doc = (partial: Partial<AgentModel & { id: string }>): Partial<AgentModel> => ({
  id: partial.id ?? 'a1',
  name: partial.name ?? 'Agent',
  category: partial.category ?? AgentCategory.Coding,
  description: partial.description ?? 'Desc',
  rule: partial.rule ?? 'Rule',
  userId: partial.userId ?? 'user-1',
  status: partial.status ?? AgentStatus.Active,
  assignedMcpIds: partial.assignedMcpIds ?? ['mcp-1'],
  removedAt: partial.removedAt ?? null,
  createdAt: partial.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: partial.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
});

describe('getListByMcpId agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
  });

  it('should return agents assigned to the given mcp for the user', async () => {
    mockGetManyRaw.mockResolvedValue([doc({ id: 'a1', assignedMcpIds: ['mcp-1'] })]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListByMcpId({ userId: 'user-1', mcpId: 'mcp-1' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.assignedMcpIds).toContain('mcp-1');
    expect(result.totalCount).toBe(1);
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        assignedMcpIds: 'mcp-1',
        removedAt: null,
      },
      expect.objectContaining({ offset: 0, limit: 10 }),
    );
  });

  it('should apply pagination using page and size', async () => {
    mockGetManyRaw.mockResolvedValue(Array.from({ length: 5 }).map((_, idx) => doc({ id: `page-${idx}` })));
    mockCountDocuments.mockResolvedValue(12);

    const result = await getListByMcpId({ userId: 'user-1', mcpId: 'mcp-1', page: 1, size: 5 });

    expect(result.items).toHaveLength(5);
    expect(result.totalCount).toBe(12);
    expect(result.page).toBe(1);
    expect(result.size).toBe(5);
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ offset: 5, limit: 5 }),
    );
  });

  it('should not surface agents owned by another user', async () => {
    mockGetManyRaw.mockResolvedValue([]);

    const result = await getListByMcpId({ userId: 'user-99', mcpId: 'mcp-1' });

    expect(result.items).toHaveLength(0);
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-99' }),
      expect.any(Object),
    );
  });

  it('should cap page size to service maximum', async () => {
    mockGetManyRaw.mockResolvedValue([]);

    const result = await getListByMcpId({ userId: 'user-1', mcpId: 'mcp-1', page: 0, size: 999 });

    expect(result.size).toBeLessThanOrEqual(50);
  });

  it('should reject invalid pagination parameters before querying MongoDB', async () => {
    await expect(getListByMcpId({ userId: 'user-1', mcpId: 'mcp-1', page: -1, size: 10 })).rejects.toThrow(
      WrongParamError,
    );
  });
});
