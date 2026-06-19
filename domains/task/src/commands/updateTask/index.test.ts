import { describe, it, expect, vi, beforeEach } from 'vitest';

import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import { NotFoundError, ValidationError } from '@vassembly/errors';

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

import { updateTask } from './index';

describe('updateTask task command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return model with title set when updating title only', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Valid title',
      },
    });

    const result = await updateTask({ id: 'task-1', title: 'Valid title' });

    expect(mockPersist).toHaveBeenCalledWith({
      id: 'task-1',
      data: { title: 'Valid title' },
    });
    expect(result.data?.title).toBe('Valid title');
  });

  it('should return model with category set when updating category only', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'task-1',
        category: INTENT_CATEGORY_SLUG.Task,
      },
    });

    const result = await updateTask({ id: 'task-1', category: INTENT_CATEGORY_SLUG.Task });

    expect(mockPersist).toHaveBeenCalledWith({
      id: 'task-1',
      data: { category: INTENT_CATEGORY_SLUG.Task },
    });
    expect(result.data?.category).toBe(INTENT_CATEGORY_SLUG.Task);
  });

  it('should return model with both fields set when updating title and category', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Valid title',
        category: INTENT_CATEGORY_SLUG.Question,
      },
    });

    const result = await updateTask({
      id: 'task-1',
      title: 'Valid title',
      category: INTENT_CATEGORY_SLUG.Question,
    });

    expect(mockPersist).toHaveBeenCalledWith({
      id: 'task-1',
      data: {
        title: 'Valid title',
        category: INTENT_CATEGORY_SLUG.Question,
      },
    });
    expect(result.data?.title).toBe('Valid title');
    expect(result.data?.category).toBe(INTENT_CATEGORY_SLUG.Question);
  });

  it('should return model with category cleared when category is null', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'task-1',
        category: null,
      },
    });

    const result = await updateTask({ id: 'task-1', category: null });

    expect(mockPersist).toHaveBeenCalledWith({
      id: 'task-1',
      data: { category: null },
    });
    expect(result.data?.category).toBeNull();
  });

  it('should throw ValidationError when neither title nor category is provided', async () => {
    await expect(updateTask({ id: 'task-1' })).rejects.toThrow(ValidationError);
  });

  it('should throw NotFoundError when task is not found', async () => {
    mockPersist.mockRejectedValue(new NotFoundError('Instance with id task-missing not found'));

    await expect(updateTask({ id: 'task-missing', title: 'Title' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when title is empty', async () => {
    await expect(updateTask({ id: 'task-1', title: '' })).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when title exceeds 120 characters', async () => {
    await expect(
      updateTask({ id: 'task-1', title: 'x'.repeat(121) }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when id is empty', async () => {
    await expect(updateTask({ id: '', title: 'Title' })).rejects.toThrow(ValidationError);
  });
});
