import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetModelById, mockPersist } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockPersist: vi.fn(),
}));

vi.mock('../../queries/getModelById', () => ({
  getModelById: mockGetModelById,
}));

vi.mock('../../clients', () => ({
  taskPlanInstanceMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDbById: vi.fn(() => mockPersist),
}));

import { updateItemStatus } from './index';
import { TaskPlanInstanceStatus } from '../../model';

const INSTANCE_ID = '507f1f77bcf86cd799439011';

describe('updateItemStatus task plan instance command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.Pending,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.Pending,
            startedAt: null,
            completedAt: null,
            failedAt: null,
          },
          {
            templateItemIndex: 1,
            status: TaskPlanInstanceStatus.Pending,
            startedAt: null,
            completedAt: null,
            failedAt: null,
          },
        ],
      },
    });
  });

  it('should derive instance status as in-progress when one item is in-progress', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.InProgress,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.InProgress,
            startedAt: new Date('2026-07-27T10:00:00.000Z'),
          },
          {
            templateItemIndex: 1,
            status: TaskPlanInstanceStatus.Pending,
          },
        ],
      },
    });

    const result = await updateItemStatus({
      id: INSTANCE_ID,
      templateItemIndex: 0,
      status: TaskPlanInstanceStatus.InProgress,
    });

    expect(result.data.status).toBe(TaskPlanInstanceStatus.InProgress);
    expect(result.data.items?.[0]?.status).toBe(TaskPlanInstanceStatus.InProgress);
  });

  it('should derive instance status as done when all items are done', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.Done,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.Done,
            completedAt: new Date('2026-07-27T10:05:00.000Z'),
          },
          {
            templateItemIndex: 1,
            status: TaskPlanInstanceStatus.Done,
            completedAt: new Date('2026-07-27T10:10:00.000Z'),
          },
        ],
      },
    });

    const result = await updateItemStatus({
      id: INSTANCE_ID,
      templateItemIndex: 1,
      status: TaskPlanInstanceStatus.Done,
      output: { summary: 'All clear' },
    });

    expect(result.data.status).toBe(TaskPlanInstanceStatus.Done);
  });

  it('should derive instance status as failed when an item fails', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.Failed,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.Failed,
            failedAt: new Date('2026-07-27T10:05:00.000Z'),
            errorMessage: 'Agent timeout',
          },
        ],
      },
    });

    const result = await updateItemStatus({
      id: INSTANCE_ID,
      templateItemIndex: 0,
      status: TaskPlanInstanceStatus.Failed,
      errorMessage: 'Agent timeout',
    });

    expect(result.data.status).toBe(TaskPlanInstanceStatus.Failed);
    expect(result.data.items?.[0]?.errorMessage).toBe('Agent timeout');
  });
});
