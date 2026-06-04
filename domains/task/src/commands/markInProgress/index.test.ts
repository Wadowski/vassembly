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

import { markInProgress } from './index';

describe('markInProgress task command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist in-progress status with startedAt when input is valid', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'in-progress',
        startedAt: new Date('2026-06-04T12:00:00.000Z'),
      },
    });

    const result = await markInProgress({ taskId: 'task-1' });

    expect(result.data).toBeDefined();
    expect(result.data?.status).toBe('in-progress');
  });

  it('should throw ValidationError when taskId is empty', async () => {
    await expect(markInProgress({ taskId: '' })).rejects.toThrow(ValidationError);
  });
});
