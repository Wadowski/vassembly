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

import { markWaiting } from './index';

describe('markWaiting command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return task with waiting status when task is in-progress', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      id: 'task-1',
      status: 'waiting',
    });

    const result = await markWaiting({ taskId: 'task-1' });

    expect(result.data?.status).toBe('waiting');
    expect(result.data?.id).toBe('task-1');
  });

  it('should throw ConflictError with TASK_NOT_WAITABLE when task is not in-progress', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'done',
      },
    });
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(markWaiting({ taskId: 'task-1' })).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ConflictError &&
        (error.error as { code?: string } | undefined)?.code === 'TASK_NOT_WAITABLE'
      );
    });
  });

  it('should throw NotFoundError when task does not exist', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('Task not found'));
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(markWaiting({ taskId: 'missing-task' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when taskId is empty', async () => {
    await expect(markWaiting({ taskId: '' })).rejects.toThrow(ValidationError);
  });
});
