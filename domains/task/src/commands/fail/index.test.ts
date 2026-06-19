import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, ValidationError } from '@vassembly/errors';

const { mockConditionalStatusUpdate } = vi.hoisted(() => ({
  mockConditionalStatusUpdate: vi.fn(),
}));

vi.mock('../shared/conditionalStatusUpdate', () => ({
  conditionalStatusUpdate: mockConditionalStatusUpdate,
}));

import { fail } from './index';

describe('fail task command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist failed status with error fields and failedAt when task is failable', async () => {
    mockConditionalStatusUpdate.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'failed',
        errorMessage: 'Missing credential',
        errorCode: 'MISSING_CREDENTIAL',
        failedAt: new Date('2026-06-04T12:00:00.000Z'),
      },
    });

    const result = await fail({
      taskId: 'task-1',
      errorMessage: 'Missing credential',
      errorCode: 'MISSING_CREDENTIAL',
    });

    expect(mockConditionalStatusUpdate).toHaveBeenCalledWith({
      taskId: 'task-1',
      filter: {
        status: { $nin: ['waiting', 'done', 'failed'] },
      },
      update: expect.objectContaining({
        status: 'failed',
        errorMessage: 'Missing credential',
        errorCode: 'MISSING_CREDENTIAL',
        failedAt: expect.any(Date),
      }),
      conflictCode: 'TASK_NOT_FAILABLE',
      conflictMessage: 'Task cannot be failed from its current status',
    });
    expect(result.data?.errorCode).toBe('MISSING_CREDENTIAL');
  });

  it('should throw ConflictError when task is waiting', async () => {
    mockConditionalStatusUpdate.mockRejectedValue(
      new ConflictError('Task cannot be failed from its current status', {
        code: 'TASK_NOT_FAILABLE',
      }),
    );

    await expect(
      fail({
        taskId: 'task-1',
        errorMessage: 'Unexpected error',
        errorCode: 'INTERNAL_ERROR',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should throw ValidationError when errorMessage is empty', async () => {
    await expect(
      fail({ taskId: 'task-1', errorMessage: '', errorCode: 'INTERNAL_ERROR' }),
    ).rejects.toThrow(ValidationError);
  });
});
