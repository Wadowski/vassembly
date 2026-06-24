import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InternalError } from '@vassembly/errors';

import type { SpecializationResponse } from '@vassembly/domain-specialization';

import type { ListSpecializationsResult } from './types';

const { mockGetList, mockGetBySpecializationId, mockGetMcpList } = vi.hoisted(() => ({
  mockGetList: vi.fn(),
  mockGetBySpecializationId: vi.fn(),
  mockGetMcpList: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    commands: {},
    queries: {
      getList: mockGetList,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    commands: {},
    queries: {
      getBySpecializationId: mockGetBySpecializationId,
    },
  },
}));

vi.mock('@vassembly/domain-mcp', () => ({
  MAX_PAGE_SIZE: 50,
  default: {
    commands: {},
    queries: {
      getList: mockGetMcpList,
    },
  },
}));

import { listSpecializations } from './index';

const buildSpecializationItem = (
  overrides: Partial<SpecializationResponse> = {},
): SpecializationResponse => ({
  id: 'spec-1',
  name: 'Finance',
  description: 'Financial analysis and reporting',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

const buildDomainResult = (
  overrides: Partial<ListSpecializationsResult> = {},
): ListSpecializationsResult => ({
  items: [buildSpecializationItem()],
  total: 1,
  page: 0,
  size: 20,
  ...overrides,
});

describe('listSpecializations handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBySpecializationId.mockResolvedValue({
      items: [{ id: 'agent-1' }],
    });
    mockGetMcpList.mockResolvedValue({
      items: [{ id: 'mcp-1' }],
      total: 1,
      page: 0,
      size: 50,
    });
  });

  it('should return paginated specializations when page and size are provided', async () => {
    mockGetList.mockResolvedValue(
      buildDomainResult({
        items: [
          buildSpecializationItem(),
          buildSpecializationItem({ id: 'spec-2', name: 'Legal' }),
        ],
        total: 42,
        page: 0,
        size: 20,
      }),
    );

    const result = await listSpecializations({ page: 0, size: 20 });

    expect(result.total).toBe(42);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      ...buildSpecializationItem(),
      agentIds: ['agent-1'],
      mcpIds: ['mcp-1'],
    });
    expect(result.page).toBe(0);
    expect(result.size).toBe(20);
  });

  it('should return search-filtered results when search arg is provided', async () => {
    const financeItem = buildSpecializationItem({ name: 'Finance' });

    mockGetList.mockImplementation(async (params) => {
      if (params.search !== 'finance') {
        return { items: [], total: 0, page: 0, size: 20 };
      }

      return { items: [financeItem], total: 1, page: 0, size: 20 };
    });

    const result = await listSpecializations({ page: 0, size: 20, search: 'finance' });

    expect(result.items).toEqual([
      {
        ...financeItem,
        agentIds: ['agent-1'],
        mcpIds: ['mcp-1'],
      },
    ]);
    expect(result.total).toBe(1);
  });

  it('should pass pagination and search args to domain getList', async () => {
    mockGetList.mockImplementation(async (params) => ({
      items: [buildSpecializationItem({ name: JSON.stringify(params) })],
      total: 1,
      page: params.page ?? 0,
      size: params.size ?? 20,
    }));

    const result = await listSpecializations({ page: 2, size: 15, search: 'legal' });

    expect(JSON.parse(result.items[0]!.name)).toEqual({
      page: 2,
      size: 15,
      search: 'legal',
    });
  });

  it('should re-throw when domain query fails', async () => {
    mockGetList.mockRejectedValue(new InternalError('Database unavailable'));

    await expect(listSpecializations({ page: 0, size: 20 })).rejects.toThrow(InternalError);
  });
});
