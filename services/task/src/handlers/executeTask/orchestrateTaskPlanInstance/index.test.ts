import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskPlanInstanceStatus } from '@vassembly/domain-task-plan-instance';

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
  mockGetInstanceModelById,
  mockGetTemplateModelById,
  mockUpdateItemStatus,
  mockBackfillInstanceSkill,
  mockBackfillTemplateSkill,
  mockRunPlanItem,
  mockRecordProgressEvent,
} = vi.hoisted(() => ({
  mockGetInstanceModelById: vi.fn(),
  mockGetTemplateModelById: vi.fn(),
  mockUpdateItemStatus: vi.fn(),
  mockBackfillInstanceSkill: vi.fn(),
  mockBackfillTemplateSkill: vi.fn(),
  mockRunPlanItem: vi.fn(),
  mockRecordProgressEvent: vi.fn(),
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
    commands: {
      updateItemStatus: mockUpdateItemStatus,
      backfillItemSkillId: mockBackfillInstanceSkill,
    },
  },
}));

vi.mock('@vassembly/domain-task-plan-template', () => ({
  default: {
    queries: { getModelById: mockGetTemplateModelById },
    commands: { backfillItemSkillId: mockBackfillTemplateSkill },
  },
}));

vi.mock('./runPlanItem', () => ({
  runPlanItem: mockRunPlanItem,
}));

vi.mock('../../shared/recordProgressHelper', () => ({
  recordProgressEvent: mockRecordProgressEvent,
}));

vi.mock('../logTaskPlanEvent', () => ({
  logTaskPlanEvent: vi.fn(),
}));

import { orchestrateTaskPlanInstance } from './index';

const INSTANCE_ID = '507f1f77bcf86cd799439011';
const TEMPLATE_ID = '507f1f77bcf86cd799439012';
const COMMENT_ID = '507f1f77bcf86cd799439013';
const TASK_ID = '507f1f77bcf86cd799439014';
const AGENT_A = '507f1f77bcf86cd799439015';
const AGENT_B = '507f1f77bcf86cd799439016';
const AGENT_C = '507f1f77bcf86cd799439017';
const SKILL_NEW = '507f1f77bcf86cd799439018';

describe('orchestrateTaskPlanInstance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplateModelById.mockResolvedValue({
      data: {
        id: TEMPLATE_ID,
        items: [
          { agentId: AGENT_A, skillId: null, description: 'Parallel A', order: 1 },
          { agentId: AGENT_B, skillId: 'skill-1', description: 'Parallel B', order: 1 },
          { agentId: AGENT_C, skillId: 'skill-2', description: 'Sequential C', order: 2 },
        ],
      },
    });
    mockGetInstanceModelById.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        taskPlanTemplateId: TEMPLATE_ID,
        commentId: COMMENT_ID,
        taskId: TASK_ID,
        inputDetails: { documentReference: 'nda.pdf' },
        status: TaskPlanInstanceStatus.Pending,
        items: [
          {
            templateItemIndex: 0,
            agentId: AGENT_A,
            skillId: null,
            order: 1,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 0,
          },
          {
            templateItemIndex: 1,
            agentId: AGENT_B,
            skillId: 'skill-1',
            order: 1,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 0,
          },
          {
            templateItemIndex: 2,
            agentId: AGENT_C,
            skillId: 'skill-2',
            order: 2,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 0,
          },
        ],
      },
    });
    mockRunPlanItem.mockImplementation(async ({ templateItemIndex }: { templateItemIndex: number }) => {
      if (templateItemIndex === 0) {
        return { status: 'done', createdSkillId: SKILL_NEW };
      }

      if (templateItemIndex === 1) {
        return { status: 'done' };
      }

      return { status: 'done' };
    });
    mockUpdateItemStatus.mockResolvedValue({ data: {} });
    mockBackfillInstanceSkill.mockResolvedValue({ data: {} });
    mockBackfillTemplateSkill.mockResolvedValue({ data: {} });
    mockRecordProgressEvent.mockResolvedValue(undefined);
  });

  it('should execute order groups sequentially and items within a group in parallel', async () => {
    const result = await orchestrateTaskPlanInstance({
      taskPlanInstanceId: INSTANCE_ID,
      commentId: COMMENT_ID,
      taskId: TASK_ID,
    });

    expect(result.executedItemIndexes).toEqual([0, 1, 2]);
    expect(result.instanceStatus).toBe('done');
  });

  it('should fail fast and skip later order groups when a parallel item fails', async () => {
    mockRunPlanItem.mockImplementation(async ({ templateItemIndex }: { templateItemIndex: number }) => {
      if (templateItemIndex === 1) {
        return { status: 'failed', errorMessage: 'Worker failed' };
      }

      return { status: 'done' };
    });

    const result = await orchestrateTaskPlanInstance({
      taskPlanInstanceId: INSTANCE_ID,
      commentId: COMMENT_ID,
      taskId: TASK_ID,
    });

    expect(result.instanceStatus).toBe('failed');
    expect(result.executedItemIndexes).toEqual([0, 1]);
    expect(result.executedItemIndexes).not.toContain(2);
  });

  it('should backfill skill ids used when inline skill creation succeeds', async () => {
    const result = await orchestrateTaskPlanInstance({
      taskPlanInstanceId: INSTANCE_ID,
      commentId: COMMENT_ID,
      taskId: TASK_ID,
    });

    expect(result.skillIdsUsed).toContain(SKILL_NEW);
    expect(result.skillIdsUsed).toContain('skill-1');
    expect(result.skillIdsUsed).toContain('skill-2');
  });

  it('should pass worker output as prior items context to a later validator item', async () => {
    const workerOutput = { message: 'Contract summarized' };

    mockGetTemplateModelById.mockResolvedValue({
      data: {
        id: TEMPLATE_ID,
        items: [
          { agentId: AGENT_A, skillId: 'skill-1', description: 'Summarize contract', order: 1 },
          {
            agentId: AGENT_B,
            skillId: 'skill-2',
            description: 'Verify that summary was produced',
            order: 2,
          },
        ],
      },
    });
    mockGetInstanceModelById.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        taskPlanTemplateId: TEMPLATE_ID,
        commentId: COMMENT_ID,
        taskId: TASK_ID,
        inputDetails: {},
        status: TaskPlanInstanceStatus.Pending,
        items: [
          {
            templateItemIndex: 0,
            agentId: AGENT_A,
            skillId: 'skill-1',
            order: 1,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 0,
          },
          {
            templateItemIndex: 1,
            agentId: AGENT_B,
            skillId: 'skill-2',
            order: 2,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 0,
          },
        ],
      },
    });
    mockRunPlanItem.mockImplementation(
      async ({
        templateItemIndex,
        priorItems,
      }: {
        templateItemIndex: number;
        priorItems: Array<{ output: Record<string, unknown> | null }>;
      }) => {
        if (templateItemIndex === 0) {
          return { status: 'done', output: workerOutput };
        }

        expect(priorItems).toHaveLength(1);
        expect(priorItems[0]?.output).toEqual(workerOutput);

        return { status: 'done' };
      },
    );

    const result = await orchestrateTaskPlanInstance({
      taskPlanInstanceId: INSTANCE_ID,
      commentId: COMMENT_ID,
      taskId: TASK_ID,
    });

    expect(result.executedItemIndexes).toEqual([0, 1]);
    expect(result.instanceStatus).toBe('done');
  });
});
