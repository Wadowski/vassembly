import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, NotFoundError, ValidationError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockFindOneAndUpdate, mockGetModelById } = vi.hoisted(() => ({
  mockFindOneAndUpdate: vi.fn(),
  mockGetModelById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskMongodbDao: {
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

vi.mock('../../queries/getModelById', () => ({
  getModelById: mockGetModelById,
}));

import { markInProgressFromWaiting } from './index';

describe('markInProgressFromWaiting command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return task with in-progress status when task is waiting', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      id: 'task-1',
      status: 'in-progress',
    });

    const result = await markInProgressFromWaiting({ taskId: 'task-1' });

    expect(result.data?.status).toBe('in-progress');
    expect(result.data?.id).toBe('task-1');
  });

  it('should throw ConflictError when task is not waiting', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'in-progress',
      },
    });
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(markInProgressFromWaiting({ taskId: 'task-1' })).rejects.toSatisfy(
      (error: unknown) => {
        return (
          error instanceof ConflictError &&
          (error.error as { code?: string } | undefined)?.code === 'TASK_NOT_RESUMABLE_FROM_WAITING'
        );
      },
    );
  });

  it('should throw NotFoundError when task does not exist', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('Task not found'));
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(markInProgressFromWaiting({ taskId: 'missing-task' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should throw ValidationError when taskId is empty', async () => {
    await expect(markInProgressFromWaiting({ taskId: '' })).rejects.toThrow(ValidationError);
  });
});
