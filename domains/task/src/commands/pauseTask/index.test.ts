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

import { pauseTask } from './index';

describe('pauseTask command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return task with paused status and pausedAt when task is in-progress', async () => {
    const pausedAt = new Date('2026-06-16T10:00:00.000Z');

    mockFindOneAndUpdate.mockResolvedValue({
      id: 'task-1',
      status: 'paused',
      pausedAt,
    });

    const result = await pauseTask({ taskId: 'task-1' });

    expect(result.data?.status).toBe('paused');
    expect(result.data?.pausedAt).toEqual(pausedAt);
    expect(result.data?.id).toBe('task-1');
  });

  it('should throw ConflictError with TASK_NOT_PAUSABLE when task is not in-progress', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'done',
      },
    });
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(pauseTask({ taskId: 'task-1' })).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ConflictError &&
        (error.error as { code?: string } | undefined)?.code === 'TASK_NOT_PAUSABLE'
      );
    });
  });

  it('should throw NotFoundError when task does not exist', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('Task not found'));
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(pauseTask({ taskId: 'missing-task' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when taskId is empty', async () => {
    await expect(pauseTask({ taskId: '' })).rejects.toThrow(ValidationError);
  });
});
