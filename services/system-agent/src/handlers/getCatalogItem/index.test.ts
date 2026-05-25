import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';
import { AgentCategory } from '@vassembly/domain-system-agent';

const { mockGetActiveById } = vi.hoisted(() => ({
  mockGetActiveById: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {},
      queries: {
        getActiveById: mockGetActiveById,
      },
    },
  };
});

import { getCatalogItem } from './index';

const ACTIVE_AGENT = {
  id: 'sys-agent-1',
  name: 'Compliance Bot',
  description: 'Helps teams stay compliant',
  category: AgentCategory.Compliance,
  rule: 'You are a compliance assistant.',
  status: 'active' as const,
  removedAt: null,
};

describe('getCatalogItem handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return catalog detail with rule when active agent exists', async () => {
    mockGetActiveById.mockResolvedValue({ data: ACTIVE_AGENT });

    const result = await getCatalogItem({
      userId: 'user-1',
      systemAgentId: 'sys-agent-1',
    });

    expect(result.item.id).toBe('sys-agent-1');
    expect(result.item.rule).toBe('You are a compliance assistant.');
    expect(result.item.name).toBe('Compliance Bot');
  });

  it('should throw NotFoundError when system agent is archived or disabled', async () => {
    mockGetActiveById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      getCatalogItem({
        userId: 'user-1',
        systemAgentId: 'archived-agent',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should allow any authenticated user to fetch active catalog detail', async () => {
    mockGetActiveById.mockResolvedValue({ data: ACTIVE_AGENT });

    const result = await getCatalogItem({
      userId: 'another-user',
      systemAgentId: 'sys-agent-1',
    });

    expect(result.item.id).toBe('sys-agent-1');
  });
});
