import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TaskPlanInstanceStatus } from '../../model';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockFind } = vi.hoisted(() => ({
  mockFind: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskPlanInstanceMongodbDao: {
    find: mockFind,
  },
}));

import { getByTaskId } from './index';

const TASK_ID = '507f1f77bcf86cd799439011';
const INSTANCE_ID = '507f1f77bcf86cd799439099';

describe('getByTaskId task plan instance query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return mapped instances when taskId matches', async () => {
    mockFind.mockResolvedValue([
      {
        id: INSTANCE_ID,
        taskPlanTemplateId: '507f1f77bcf86cd799439012',
        taskId: TASK_ID,
        commentId: '507f1f77bcf86cd799439013',
        status: TaskPlanInstanceStatus.Pending,
        items: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await getByTaskId({ taskId: TASK_ID });

    expect(mockFind).toHaveBeenCalledWith({ taskId: TASK_ID });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.id).toBe(INSTANCE_ID);
    expect(result.data[0]?.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('should return empty list when no instances exist for taskId', async () => {
    mockFind.mockResolvedValue([]);

    const result = await getByTaskId({ taskId: TASK_ID });

    expect(result.data).toEqual([]);
  });
});
