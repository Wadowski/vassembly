import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TaskPlanInstanceStatus } from '@vassembly/domain-task-plan-instance';

const {
  mockGetInstanceById,
  mockGetTemplateById,
  mockListCommentsByTaskId,
  mockResolveAgentDisplayNames,
  mockResolveSkillDisplayNames,
} = vi.hoisted(() => ({
  mockGetInstanceById: vi.fn(),
  mockGetTemplateById: vi.fn(),
  mockListCommentsByTaskId: vi.fn(),
  mockResolveAgentDisplayNames: vi.fn(),
  mockResolveSkillDisplayNames: vi.fn(),
}));

vi.mock('@vassembly/domain-task-plan-instance', () => ({
  TaskPlanInstanceStatus: {
    Pending: 'pending',
    InProgress: 'in-progress',
    Done: 'done',
    Failed: 'failed',
  },
  default: {
    queries: { getById: mockGetInstanceById },
  },
}));

vi.mock('@vassembly/domain-task-plan-template', () => ({
  default: {
    queries: { getById: mockGetTemplateById },
  },
}));

vi.mock('@vassembly/domain-task-comment', () => ({
  default: {
    queries: { listByTaskId: mockListCommentsByTaskId },
  },
}));

vi.mock('./shared/resolveAgentDisplayName', () => ({
  resolveAgentDisplayNames: mockResolveAgentDisplayNames,
}));

vi.mock('./shared/resolveSkillDisplayName', () => ({
  resolveSkillDisplayNames: mockResolveSkillDisplayNames,
}));

import { registerTaskPlanResolvers } from './taskPlan';

import type { Builder } from '@vassembly/graphql';

interface CapturedResolvers {
  resolveTaskCommentPlan?: (
    parent: { taskPlanInstanceId?: string | null },
    args: unknown,
    context: { userId: string },
  ) => Promise<{ template: { shortName: string }; instance: { status: string } } | null>;
  resolveTaskSkillIdsUsed?: (parent: { id: string }) => Promise<string[]>;
}

const captureTaskPlanResolvers = (): CapturedResolvers => {
  const captured: CapturedResolvers = {};

  const builder = {
    objectType: vi.fn(),
    objectRef: vi.fn(() => ({})),
    interfaceType: vi.fn(),
    queryFields: vi.fn(),
    mutationFields: vi.fn(),
    objectField: vi.fn((typeName: string, fieldName: string, fieldConfig: (t: {
      field: (config: { resolve: unknown; type?: unknown; nullable?: boolean }) => { resolve: unknown };
    }) => { resolve: unknown }) => {
      const fieldBuilder = {
        field: (config: { resolve: unknown }) => config,
      };
      const fieldDefinition = fieldConfig(fieldBuilder);

      if (typeName === 'TaskComment' && fieldName === 'plan') {
        captured.resolveTaskCommentPlan = fieldDefinition.resolve as CapturedResolvers['resolveTaskCommentPlan'];
        return;
      }

      if (typeName === 'Task' && fieldName === 'skillIdsUsed') {
        captured.resolveTaskSkillIdsUsed = fieldDefinition.resolve as CapturedResolvers['resolveTaskSkillIdsUsed'];
      }
    }),
  } as unknown as Builder;

  registerTaskPlanResolvers(builder);

  return captured;
};

describe('registerTaskPlanResolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAgentDisplayNames.mockResolvedValue(new Map());
    mockResolveSkillDisplayNames.mockResolvedValue(new Map());
    mockGetInstanceById.mockResolvedValue({
      data: {
        id: 'instance-1',
        taskPlanTemplateId: 'template-1',
        status: TaskPlanInstanceStatus.InProgress,
        items: [],
      },
    });
    mockGetTemplateById.mockResolvedValue({
      data: {
        id: 'template-1',
        shortName: 'contract-risk-review',
        description: 'Review contracts',
        items: [],
      },
    });
    mockListCommentsByTaskId.mockResolvedValue({
      data: [
        { skillIdsUsed: ['skill-a', 'skill-b'] },
        { skillIdsUsed: ['skill-b', 'skill-c'] },
        { skillIdsUsed: null },
      ],
    });
  });

  it('should resolve nested taskComment.plan from taskPlanInstanceId', async () => {
    const { resolveTaskCommentPlan } = captureTaskPlanResolvers();

    if (resolveTaskCommentPlan === undefined) {
      throw new Error('taskComment.plan resolver was not registered');
    }

    const plan = await resolveTaskCommentPlan(
      {
        taskPlanInstanceId: 'instance-1',
      },
      {},
      { userId: 'user-1' },
    );

    expect(plan?.template.shortName).toBe('contract-risk-review');
    expect(plan?.instance.status).toBe(TaskPlanInstanceStatus.InProgress);
  });

  it('should return deduplicated skillIdsUsed across task comments', async () => {
    const { resolveTaskSkillIdsUsed } = captureTaskPlanResolvers();

    if (resolveTaskSkillIdsUsed === undefined) {
      throw new Error('Task.skillIdsUsed resolver was not registered');
    }

    const skillIdsUsed = await resolveTaskSkillIdsUsed({ id: 'task-1' });

    expect(skillIdsUsed).toEqual(['skill-a', 'skill-b', 'skill-c']);
  });
});
