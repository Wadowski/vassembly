import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const {
  mockResolveSpecializationReference,
  mockGetList,
  mockGetCatalogBySpecializationId,
  mockGetActiveByName,
  mockGetModelById,
  mockRunAgentInvokeWithTools,
} = vi.hoisted(() => ({
  mockResolveSpecializationReference: vi.fn(),
  mockGetList: vi.fn(),
  mockGetCatalogBySpecializationId: vi.fn(),
  mockGetActiveByName: vi.fn(),
  mockGetModelById: vi.fn(),
  mockRunAgentInvokeWithTools: vi.fn(),
}));

vi.mock('../resolveSpecializationReference', () => ({
  resolveSpecializationReference: mockResolveSpecializationReference,
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    queries: {
      getById: vi.fn(),
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
      getActiveRuleByName: vi.fn(),
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
  commentId: 'comment-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('invokeSkillPlanner internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveSpecializationReference.mockResolvedValue({
      id: '674a1b2c3d4e5f6789012345',
      name: 'Legal',
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
      { specializationId: 'legal', goal: 'Review NDAs' },
      BASE_CONTEXT,
    );

    expect(mockResolveSpecializationReference).toHaveBeenCalledWith({
      specializationRef: 'legal',
      context: BASE_CONTEXT,
      preferCallerSpecialization: true,
    });
    expect(JSON.parse(result)).toEqual({
      skillId: 'skill-1',
      skillName: 'nda-review',
      isNew: true,
      specializationId: '674a1b2c3d4e5f6789012345',
      action: 'create',
    });
  });

  it('should resolve specialization from caller context when specializationId is omitted', async () => {
    await invokeSkillPlannerToolHandler({ goal: 'Review NDAs' }, BASE_CONTEXT);

    expect(mockResolveSpecializationReference).toHaveBeenCalledWith({
      specializationRef: '',
      context: BASE_CONTEXT,
      preferCallerSpecialization: true,
    });
  });

  it('should throw ValidationError when specialization cannot be resolved', async () => {
    mockResolveSpecializationReference.mockRejectedValue(new ValidationError('specializationId is required'));

    await expect(
      invokeSkillPlannerToolHandler({ goal: 'Review NDAs' }, BASE_CONTEXT),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when goal is missing', async () => {
    await expect(
      invokeSkillPlannerToolHandler({ specializationId: 'legal' }, BASE_CONTEXT),
    ).rejects.toThrow(ValidationError);
  });
});
