import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, WrongParamError } from '@vassembly/errors';

const { mockGetMcpById, mockGetUserMcpConfigModel, mockGetListByMcpId } = vi.hoisted(() => ({
  mockGetMcpById: vi.fn(),
  mockGetUserMcpConfigModel: vi.fn(),
  mockGetListByMcpId: vi.fn(),
}));

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    queries: {
      getById: mockGetMcpById,
    },
  },
}));

vi.mock('@vassembly/domain-user-mcp-config', () => ({
  default: {
    queries: {
      getUserMcpConfigModel: mockGetUserMcpConfigModel,
    },
  },
}));

vi.mock('@vassembly/domain-agent', async () => {
  const { toAgentResponse } = await import('../../../../../domains/agent/src/model/toAgentResponse.js');

  return {
    default: {
      queries: {
        getListByMcpId: mockGetListByMcpId,
      },
    },
    toAgentResponse,
  };
});

import { getMcpWithAgents } from './index';

const MCP = {
  id: 'mcp-1',
  slug: 'gmail',
  name: 'Gmail MCP',
  description: 'Email tools',
  tags: ['email'],
  iconPath: '/icons/gmail.svg',
  documentationUrl: null,
  repositoryUrl: null,
  configurationStatus: 'configured',
  configSchema: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('getMcpWithAgents handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return mcp details with paginated agents assigned to that mcp', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');

    mockGetMcpById.mockResolvedValue({ data: MCP });
    mockGetUserMcpConfigModel.mockResolvedValue({ id: 'config-1', mcpId: 'mcp-1' });
    mockGetListByMcpId.mockResolvedValue({
      items: [
        {
          id: 'agent-1',
          name: 'Research bot',
          category: 'personal',
          description: 'Desc',
          rule: 'Rule',
          userId: 'user-1',
          status: 'active',
          assignedMcpIds: ['mcp-1'],
          removedAt: null,
          createdAt,
          updatedAt,
        },
      ],
      totalCount: 1,
      page: 0,
      size: 10,
    });

    const result = await getMcpWithAgents({
      userId: 'user-1',
      mcpId: 'mcp-1',
      page: 0,
      size: 10,
    });

    expect(result.mcp.id).toBe('mcp-1');
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]?.name).toBe('Research bot');
    expect(result.totalCount).toBe(1);
    expect(result.page).toBe(0);
    expect(result.size).toBe(10);
  });

  it('should throw WrongParamError when the user has not configured the mcp', async () => {
    mockGetMcpById.mockResolvedValue({ data: MCP });
    mockGetUserMcpConfigModel.mockResolvedValue(null);

    await expect(
      getMcpWithAgents({ userId: 'user-1', mcpId: 'mcp-1' }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should throw NotFoundError when the mcp catalog id is invalid', async () => {
    mockGetMcpById.mockRejectedValue(new NotFoundError('MCP not found'));
    mockGetUserMcpConfigModel.mockResolvedValue({ id: 'config-1', mcpId: 'mcp-missing' });

    await expect(
      getMcpWithAgents({ userId: 'user-1', mcpId: 'mcp-missing' }),
    ).rejects.toThrow(NotFoundError);
  });
});
