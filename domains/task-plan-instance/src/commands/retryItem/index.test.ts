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

import { retryItem } from './index';
import { TaskPlanInstanceStatus } from '../../model';

const INSTANCE_ID = '507f1f77bcf86cd799439011';

describe('retryItem task plan instance command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset failed item to pending and increment retryCount', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.Failed,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.Failed,
            retryCount: 1,
            completedAt: null,
            failedAt: new Date('2026-07-27T10:00:00.000Z'),
            errorMessage: 'Validation failed',
          },
        ],
      },
    });
    mockPersist.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.InProgress,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 2,
            completedAt: null,
            failedAt: null,
            errorMessage: null,
          },
        ],
      },
    });

    const result = await retryItem({
      id: INSTANCE_ID,
      templateItemIndex: 0,
    });

    expect(result.data.status).toBe(TaskPlanInstanceStatus.InProgress);
    expect(result.data.items?.[0]?.status).toBe(TaskPlanInstanceStatus.Pending);
    expect(result.data.items?.[0]?.retryCount).toBe(2);
  });

  it('should increment retryCount when retrying a pending item', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.InProgress,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 0,
          },
        ],
      },
    });
    mockPersist.mockResolvedValue({
      data: {
        id: INSTANCE_ID,
        status: TaskPlanInstanceStatus.InProgress,
        items: [
          {
            templateItemIndex: 0,
            status: TaskPlanInstanceStatus.Pending,
            retryCount: 1,
          },
        ],
      },
    });

    const result = await retryItem({
      id: INSTANCE_ID,
      templateItemIndex: 0,
    });

    expect(result.data.items?.[0]?.status).toBe(TaskPlanInstanceStatus.Pending);
    expect(result.data.items?.[0]?.retryCount).toBe(1);
  });
});
