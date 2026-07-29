import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

vi.mock('@vassembly/client-mongodb', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
  MongoDbDAO: vi.fn(() => ({
    getRaw: vi.fn(),
    getManyRaw: vi.fn(),
  })),
}));

const {
  mockGetModelById,
  mockListByTaskId,
  mockGetTaskQuestions,
  mockGetModelsByTaskId,
  mockGetInternalToolModelsByTaskId,
  mockGetInstanceModelById,
  mockGetTemplateModelById,
  mockResolveCommentProgress,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockListByTaskId: vi.fn(),
  mockGetTaskQuestions: vi.fn(),
  mockGetModelsByTaskId: vi.fn(),
  mockGetInternalToolModelsByTaskId: vi.fn(),
  mockGetInstanceModelById: vi.fn(),
  mockGetTemplateModelById: vi.fn(),
  mockResolveCommentProgress: vi.fn(),
}));

vi.mock('@vassembly/domain-task-progress', () => ({
  ProgressEventState: {
    Started: 'started',
    Completed: 'completed',
    Failed: 'failed',
    Waiting: 'waiting',
  },
  default: {
    queries: {},
    commands: {},
  },
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: { getModelById: mockGetModelById },
  },
}));

vi.mock('@vassembly/domain-task-comment', () => ({
  default: {
    queries: { listByTaskId: mockListByTaskId },
  },
}));

vi.mock('@vassembly/domain-task-questions', () => ({
  default: {
    queries: { getTaskQuestions: mockGetTaskQuestions },
  },
}));

vi.mock('@vassembly/domain-mcp-usage', () => ({
  default: {
    queries: { getModelsByTaskId: mockGetModelsByTaskId },
  },
}));

vi.mock('@vassembly/domain-internal-tool-usage', () => ({
  default: {
    queries: { getModelsByTaskId: mockGetInternalToolModelsByTaskId },
  },
}));

vi.mock('@vassembly/domain-task-plan-instance', () => ({
  TaskPlanInstanceStatus: {
    Pending: 'pending',
    InProgress: 'in-progress',
    Done: 'done',
    Failed: 'failed',
  },
  default: {
    queries: { getModelById: mockGetInstanceModelById },
  },
}));

vi.mock('@vassembly/domain-task-plan-template', () => ({
  default: {
    queries: { getModelById: mockGetTemplateModelById },
  },
}));

vi.mock('./resolveCommentProgress', () => ({
  resolveCommentProgress: mockResolveCommentProgress,
}));

vi.mock('./mapMcpUsageEventsToTimelineItems', () => ({
  mapMcpUsageEventsToTimelineItems: vi.fn(() => []),
}));

vi.mock('./mapInternalToolUsageEventsToTimelineItems', () => ({
  mapInternalToolUsageEventsToTimelineItems: vi.fn(() => []),
}));

vi.mock('./aggregateProgressStats', () => ({
  aggregateProgressStats: vi.fn(() => ({
    totalDuration: 0,
    totalTokens: 0,
  })),
}));

import { getTaskActivityTimeline } from './index';

const TASK_ID = '507f1f77bcf86cd799439011';
const USER_ID = 'user-1';
const COMMENT_ID = '507f1f77bcf86cd799439012';
const INSTANCE_ID = '507f1f77bcf86cd799439013';
const TEMPLATE_ID = '507f1f77bcf86cd799439014';

describe('getTaskActivityTimeline handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({
      data: {
        id: TASK_ID,
        userId: USER_ID,
      },
    });
    mockListByTaskId.mockResolvedValue({
      data: [
        {
          id: COMMENT_ID,
          userText: 'Review this contract',
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
          updatedAt: new Date('2026-01-01T10:00:00.000Z'),
          specializationIds: [],
          skillIdsUsed: [],
          taskPlanInstanceId: INSTANCE_ID,
        },
      ],
    });
    mockGetTaskQuestions.mockResolvedValue({ data: { answeredQuestions: [] } });
    mockGetModelsByTaskId.mockResolvedValue({ data: [] });
    mockGetInternalToolModelsByTaskId.mockResolvedValue({ data: [] });
    mockResolveCommentProgress.mockResolvedValue(null);
    mockGetInstanceModelById.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        taskPlanTemplateId: TEMPLATE_ID,
        status: 'in-progress',
        createdAt: new Date('2026-01-01T10:05:00.000Z'),
        inputDetails: { documentReference: 'nda.pdf' },
        items: [
          {
            templateItemIndex: 0,
            agentId: 'agent-1',
            skillId: null,
            order: 1,
            status: 'pending',
            startedAt: null,
            completedAt: null,
            failedAt: null,
            errorMessage: null,
            retryCount: 0,
          },
        ],
      },
    });
    mockGetTemplateModelById.mockResolvedValue({
      data: {
        id: TEMPLATE_ID,
        shortName: 'contract-review',
        description: 'Review contract documents',
        inputDetails: {},
        outputDetails: {},
        items: [
          {
            agentId: 'agent-1',
            skillId: null,
            description: 'Extract clauses',
            order: 1,
          },
        ],
      },
    });
  });

  it('should emit plan timeline item when comment has taskPlanInstanceId', async () => {
    const result = await getTaskActivityTimeline({
      userId: USER_ID,
      taskId: TASK_ID,
    });

    const planItem = result.items.find((item) => item.kind === 'plan');

    expect(planItem).toMatchObject({
      kind: 'plan',
      id: `plan-${COMMENT_ID}`,
      commentId: COMMENT_ID,
      filterGroup: 'plans',
      planTemplateShortName: 'contract-review',
      planTemplateDescription: 'Review contract documents',
      planInstanceStatus: 'in-progress',
    });
    expect(planItem && 'planItems' in planItem ? planItem.planItems : []).toHaveLength(1);
  });

  it('should throw NotFoundError when task does not belong to user', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: TASK_ID,
        userId: 'other-user',
      },
    });

    await expect(
      getTaskActivityTimeline({
        userId: USER_ID,
        taskId: TASK_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
