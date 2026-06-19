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

import { retryTask } from './index';

describe('retryTask command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return in-progress task with cleared error fields when task is paused', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      id: 'task-1',
      status: 'in-progress',
      errorMessage: null,
      errorCode: null,
      failedAt: null,
      pausedAt: new Date('2026-06-16T09:00:00.000Z'),
    });

    const result = await retryTask({ taskId: 'task-1' });

    expect(result.data?.status).toBe('in-progress');
    expect(result.data?.errorMessage).toBeNull();
    expect(result.data?.errorCode).toBeNull();
    expect(result.data?.failedAt).toBeNull();
  });

  it('should return in-progress task with cleared error fields when task is failed', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      id: 'task-2',
      status: 'in-progress',
      errorMessage: null,
      errorCode: null,
      failedAt: null,
    });

    const result = await retryTask({ taskId: 'task-2' });

    expect(result.data?.status).toBe('in-progress');
    expect(result.data?.errorMessage).toBeNull();
    expect(result.data?.errorCode).toBeNull();
    expect(result.data?.failedAt).toBeNull();
  });

  it('should throw ConflictError with TASK_NOT_RETRYABLE when task is not paused or failed', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'done',
      },
    });
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(retryTask({ taskId: 'task-1' })).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ConflictError &&
        (error.error as { code?: string } | undefined)?.code === 'TASK_NOT_RETRYABLE'
      );
    });
  });

  it('should throw NotFoundError when task does not exist', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('Task not found'));
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(retryTask({ taskId: 'missing-task' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when taskId is empty', async () => {
    await expect(retryTask({ taskId: '' })).rejects.toThrow(ValidationError);
  });
});
