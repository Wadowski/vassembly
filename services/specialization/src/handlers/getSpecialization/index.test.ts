import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

import type { SpecializationResponse } from '@vassembly/domain-specialization';
import type { SystemAgentModel } from '@vassembly/domain-system-agent';
import type { McpListItemResponse } from '@vassembly/domain-mcp';

const { mockGetById, mockGetBySpecializationId, mockGetMcpList } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockGetBySpecializationId: vi.fn(),
  mockGetMcpList: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    commands: {},
    queries: {
      getById: mockGetById,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  toSystemAgentResponse: ({
    systemAgent,
  }: {
    systemAgent: { id?: string; name?: string; status?: string };
  }) => ({
    id: systemAgent.id!,
    name: systemAgent.name!,
    status: systemAgent.status!,
  }),
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

import { getSpecialization } from './index';

const SPECIALIZATION_ID = 'spec-1';

const buildSpecialization = (
  overrides: Partial<SpecializationResponse> = {},
): SpecializationResponse => ({
  id: SPECIALIZATION_ID,
  name: 'Finance',
  description: 'Financial analysis and reporting',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

const buildSystemAgent = (overrides: Partial<SystemAgentModel> = {}): SystemAgentModel =>
  ({
    id: 'agent-1',
    name: 'Finance researcher',
    rule: 'Research finance topics.',
    status: 'active',
    createdByAdminId: 'admin-1',
    updatedByAdminId: 'admin-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    specializationId: SPECIALIZATION_ID,
    ...overrides,
  }) as SystemAgentModel;

const buildMcpItem = (overrides: Partial<McpListItemResponse> = {}): McpListItemResponse => ({
  id: 'mcp-1',
  slug: 'github',
  name: 'GitHub MCP',
  description: 'Browse repositories and issues',
  tags: ['development'],
  iconPath: '/mcps/github.svg',
  documentationUrl: 'https://example.com/docs/github',
  repositoryUrl: 'https://github.com/example/github-mcp',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

describe('getSpecialization handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({ data: buildSpecialization() });
    mockGetBySpecializationId.mockResolvedValue({
      items: [
        buildSystemAgent({ id: 'agent-1' }),
        buildSystemAgent({ id: 'agent-2', name: 'Finance worker' }),
      ],
    });
    mockGetMcpList.mockResolvedValue({
      items: [
        buildMcpItem({ id: 'mcp-1' }),
        buildMcpItem({ id: 'mcp-2', slug: 'gmail', name: 'Gmail MCP' }),
      ],
      total: 2,
      page: 0,
      size: 50,
    });
  });

  it('should return specialization with resolved agentIds, mcpIds, agents, and mcps', async () => {
    const result = await getSpecialization({ id: SPECIALIZATION_ID });

    expect(result.specialization).toEqual({
      ...buildSpecialization(),
      agentIds: ['agent-1', 'agent-2'],
      mcpIds: ['mcp-1', 'mcp-2'],
      agents: [
        { id: 'agent-1', name: 'Finance researcher', status: 'active' },
        { id: 'agent-2', name: 'Finance worker', status: 'active' },
      ],
      mcps: [
        {
          id: 'mcp-1',
          name: 'GitHub MCP',
          slug: 'github',
          iconPath: '/mcps/github.svg',
          description: 'Browse repositories and issues',
        },
        {
          id: 'mcp-2',
          name: 'Gmail MCP',
          slug: 'gmail',
          iconPath: '/mcps/github.svg',
          description: 'Browse repositories and issues',
        },
      ],
    });
  });

  it('should query specialization, agents, and mcps in parallel', async () => {
    await getSpecialization({ id: SPECIALIZATION_ID });

    expect(mockGetById).toHaveBeenCalledWith({ id: SPECIALIZATION_ID });
    expect(mockGetBySpecializationId).toHaveBeenCalledWith({
      specializationId: SPECIALIZATION_ID,
    });
    expect(mockGetMcpList).toHaveBeenCalledWith({
      specializationId: SPECIALIZATION_ID,
      page: 0,
      size: 50,
    });
  });

  it('should throw NotFoundError when specialization does not exist', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Specialization not found'));

    await expect(getSpecialization({ id: 'missing-id' })).rejects.toThrow(NotFoundError);
  });

  it('should omit agents without ids from agentIds', async () => {
    mockGetBySpecializationId.mockResolvedValue({
      items: [buildSystemAgent({ id: 'agent-1' }), buildSystemAgent({ id: undefined })],
    });

    const result = await getSpecialization({ id: SPECIALIZATION_ID });

    expect(result.specialization.agentIds).toEqual(['agent-1']);
  });
});
