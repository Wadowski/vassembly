import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

const { mockGetById, mockUpdate } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', async () => {
  const { toAgentResponse } = await import('../../../../../domains/agent/src/model/toAgentResponse.js');

  return {
    default: {
      commands: {
        update: mockUpdate,
      },
      queries: {
        getById: mockGetById,
      },
    },
    toAgentResponse,
  };
});

import { unassignMcpFromAgent } from './index';

const AGENT = {
  id: 'agent-1',
  userId: 'user-1',
  name: 'Research bot',
  category: 'personal',
  description: 'Desc',
  rule: 'Rule',
  status: 'active',
  assignedMcpIds: ['mcp-1', 'mcp-2'],
  removedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('unassignMcpFromAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove the mcpId from the agent assignedMcpIds array', async () => {
    mockGetById.mockResolvedValue({ data: AGENT });
    mockUpdate.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Research bot',
        category: 'personal',
        description: 'Desc',
        rule: 'Rule',
        status: 'active',
        assignedMcpIds: ['mcp-2'],
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      },
    });

    const result = await unassignMcpFromAgent({
      userId: 'user-1',
      mcpId: 'mcp-1',
      agentId: 'agent-1',
    });

    expect(result.agent.assignedMcpIds).toEqual(['mcp-2']);
  });

  it('should return the unchanged agent when the mcpId is not assigned', async () => {
    mockGetById.mockResolvedValue({ data: AGENT });

    const result = await unassignMcpFromAgent({
      userId: 'user-1',
      mcpId: 'mcp-3',
      agentId: 'agent-1',
    });

    expect(result.agent.assignedMcpIds).toEqual(['mcp-1', 'mcp-2']);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the agent is not owned by the user', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(
      unassignMcpFromAgent({
        userId: 'user-2',
        mcpId: 'mcp-1',
        agentId: 'agent-1',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
