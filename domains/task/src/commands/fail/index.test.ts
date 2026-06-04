import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

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
  taskMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDbById: vi.fn(() => mockPersist),
}));

import { fail } from './index';

describe('fail task command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist failed status with error fields and failedAt when input is valid', async () => {
    mockPersist.mockResolvedValue({
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

    expect(mockPersist).toHaveBeenCalledWith({
      id: 'task-1',
      data: expect.objectContaining({
        status: 'failed',
        errorMessage: 'Missing credential',
        errorCode: 'MISSING_CREDENTIAL',
        failedAt: expect.any(Date),
      }),
    });
    expect(result.data?.errorCode).toBe('MISSING_CREDENTIAL');
  });

  it('should throw ValidationError when errorMessage is empty', async () => {
    await expect(
      fail({ taskId: 'task-1', errorMessage: '', errorCode: 'INTERNAL_ERROR' }),
    ).rejects.toThrow(ValidationError);
  });
});
