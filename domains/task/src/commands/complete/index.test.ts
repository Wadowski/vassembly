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

import { complete } from './index';

describe('complete task command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist done status with llmResponse and completedAt when input is valid', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'done',
        llmResponse: 'Summary text',
        completedAt: new Date('2026-06-04T12:00:00.000Z'),
      },
    });

    const result = await complete({ taskId: 'task-1', llmResponse: 'Summary text' });

    expect(mockPersist).toHaveBeenCalledWith({
      id: 'task-1',
      data: expect.objectContaining({
        status: 'done',
        llmResponse: 'Summary text',
        completedAt: expect.any(Date),
      }),
    });
    expect(result.data?.status).toBe('done');
    expect(result.data?.llmResponse).toBe('Summary text');
  });

  it('should throw ValidationError when llmResponse exceeds 5000 characters', async () => {
    await expect(
      complete({ taskId: 'task-1', llmResponse: 'x'.repeat(5001) }),
    ).rejects.toThrow(ValidationError);
  });
});
