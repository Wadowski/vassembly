import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const {
  mockGetById,
  mockGetList,
  mockGetCatalogBySpecializationId,
  mockGetActiveByName,
  mockGetModelById,
  mockRunAgentInvokeWithTools,
} = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockGetList: vi.fn(),
  mockGetCatalogBySpecializationId: vi.fn(),
  mockGetActiveByName: vi.fn(),
  mockGetModelById: vi.fn(),
  mockRunAgentInvokeWithTools: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    queries: {
      getById: mockGetById,
    },
  },
}));

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    queries: {
      getList: mockGetList,
    },
  },
}));

vi.mock('@vassembly/domain-skill', () => ({
  formatSkillsCatalogSection: ({ items }: { items: Array<{ name: string; description: string }> }) =>
    items.length === 0 ? '' : `## Available Skills\n\n- **${items[0]?.name}**: ${items[0]?.description}`,
  default: {
    queries: {
      getCatalogBySpecializationId: mockGetCatalogBySpecializationId,
      getModelById: mockGetModelById,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: {
      getActiveByName: mockGetActiveByName,
    },
  },
}));

vi.mock('../runAgentInvokeWithTools', () => ({
  runAgentInvokeWithTools: mockRunAgentInvokeWithTools,
}));

import { invokeSkillPlannerToolHandler } from './index';

import type { InternalToolContext } from '../types';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('invokeSkillPlanner internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({
      data: { id: 'spec-legal', name: 'Legal', description: 'Legal work' },
    });
    mockGetList.mockResolvedValue({
      items: [{ id: 'mcp-1', slug: 'legal-search', name: 'Legal Search', description: 'Search' }],
      total: 1,
      page: 0,
      size: 500,
    });
    mockGetCatalogBySpecializationId.mockResolvedValue({
      items: [{ name: 'nda-review', description: 'Review NDAs' }],
    });
    mockGetActiveByName.mockResolvedValue({
      data: { id: 'skill-planner-1' },
    });
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: '{"skillId":"skill-1","isNew":true}',
      metadata: {
        mcpIdsUsed: ['mcp-1'],
        skippedMcpIds: [],
        internalToolIdsUsed: [],
        skippedInternalToolIds: [],
        maxUseAgentDepth: 3,
      },
    });
    mockGetModelById.mockResolvedValue({
      data: { id: 'skill-1', name: 'nda-review' },
    });
  });

  it('should return structured JSON with skill metadata when planner succeeds', async () => {
    const result = await invokeSkillPlannerToolHandler(
      { specializationId: 'spec-legal', goal: 'Review NDAs' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({
      skillId: 'skill-1',
      skillName: 'nda-review',
      isNew: true,
      specializationId: 'spec-legal',
    });
  });

  it('should throw ValidationError when specializationId is missing', async () => {
    await expect(
      invokeSkillPlannerToolHandler({ goal: 'Review NDAs' }, BASE_CONTEXT),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when goal is missing', async () => {
    await expect(
      invokeSkillPlannerToolHandler({ specializationId: 'spec-legal' }, BASE_CONTEXT),
    ).rejects.toThrow(ValidationError);
  });
});
