import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockPersist } = vi.hoisted(() => ({
  mockPersist: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskPlanInstanceMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  createDb: vi.fn(() => mockPersist),
}));

import { create } from './index';
import { TaskPlanInstanceStatus } from '../../model';

const TEMPLATE_ID = '507f1f77bcf86cd799439011';
const TASK_ID = '507f1f77bcf86cd799439012';
const COMMENT_ID = '507f1f77bcf86cd799439013';

const templateItems = [
  {
    agentId: '507f1f77bcf86cd799439014',
    skillId: '507f1f77bcf86cd799439015',
    description: 'Extract clauses',
    order: 1,
  },
  {
    agentId: '507f1f77bcf86cd799439016',
    skillId: null,
    description: 'Summarize findings',
    order: 2,
  },
];

describe('create task plan instance command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should seed one pending item per template item when creating instance', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439099',
        commentId: COMMENT_ID,
        status: TaskPlanInstanceStatus.Pending,
        items: templateItems.map((item, index) => ({
          templateItemIndex: index,
          agentId: item.agentId,
          skillId: item.skillId,
          order: item.order,
          status: TaskPlanInstanceStatus.Pending,
          retryCount: 0,
        })),
      },
    });

    const result = await create({
      taskPlanTemplateId: TEMPLATE_ID,
      taskId: TASK_ID,
      commentId: COMMENT_ID,
      inputDetails: { documentReference: 'nda.pdf' },
      templateItems,
    });

    expect(result.data.items).toHaveLength(2);
    expect(result.data.items?.every((item) => item.status === TaskPlanInstanceStatus.Pending)).toBe(true);
    expect(result.data.items?.every((item) => item.retryCount === 0)).toBe(true);
  });

  it('should throw ConflictError when commentId already has an instance', async () => {
    const duplicateKeyError = Object.assign(new Error('duplicate key'), { code: 11000 });
    mockPersist.mockRejectedValue(duplicateKeyError);

    await expect(
      create({
        taskPlanTemplateId: TEMPLATE_ID,
        taskId: TASK_ID,
        commentId: COMMENT_ID,
        inputDetails: {},
        templateItems,
      }),
    ).rejects.toThrow(ConflictError);
  });
});
