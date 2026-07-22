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
        id: '507f1f77bcf86cd799439011',
        title: 'Valid title',
      },
    });

    const result = await updateTask({ id: '507f1f77bcf86cd799439011', title: 'Valid title' });

    expect(mockPersist).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      data: { title: 'Valid title' },
    });
    expect(result.data?.title).toBe('Valid title');
  });

  it('should return model with category set when updating category only', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439011',
        category: INTENT_CATEGORY_SLUG.Task,
      },
    });

    const result = await updateTask({ id: '507f1f77bcf86cd799439011', category: INTENT_CATEGORY_SLUG.Task });

    expect(mockPersist).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      data: { category: INTENT_CATEGORY_SLUG.Task },
    });
    expect(result.data?.category).toBe(INTENT_CATEGORY_SLUG.Task);
  });

  it('should return model with both fields set when updating title and category', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439011',
        title: 'Valid title',
        category: INTENT_CATEGORY_SLUG.Task,
      },
    });

    const result = await updateTask({
      id: '507f1f77bcf86cd799439011',
      title: 'Valid title',
      category: INTENT_CATEGORY_SLUG.Task,
    });

    expect(mockPersist).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      data: {
        title: 'Valid title',
        category: INTENT_CATEGORY_SLUG.Task,
      },
    });
    expect(result.data?.title).toBe('Valid title');
    expect(result.data?.category).toBe(INTENT_CATEGORY_SLUG.Task);
  });

  it('should return model with category cleared when category is null', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439011',
        category: null,
      },
    });

    const result = await updateTask({ id: '507f1f77bcf86cd799439011', category: null });

    expect(mockPersist).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      data: { category: null },
    });
    expect(result.data?.category).toBeNull();
  });

  it('should return model with specializationIds set when updating specializationIds only', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439011',
        specializationIds: ['spec-1'],
      },
    });

    const result = await updateTask({ id: '507f1f77bcf86cd799439011', specializationIds: ['spec-1'] });

    expect(mockPersist).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      data: { specializationIds: ['spec-1'] },
    });
    expect(result.data?.specializationIds).toEqual(['spec-1']);
  });

  it('should return model with specializationIds cleared when specializationIds is null', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439011',
        specializationIds: null,
      },
    });

    const result = await updateTask({ id: '507f1f77bcf86cd799439011', specializationIds: null });

    expect(mockPersist).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      data: { specializationIds: null },
    });
    expect(result.data?.specializationIds).toBeNull();
  });

  it('should return model with skillIdsUsed set when updating skillIdsUsed only', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439011',
        skillIdsUsed: ['skill-1', 'skill-2'],
      },
    });

    const result = await updateTask({ id: '507f1f77bcf86cd799439011', skillIdsUsed: ['skill-1', 'skill-2'] });

    expect(mockPersist).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      data: { skillIdsUsed: ['skill-1', 'skill-2'] },
    });
    expect(result.data?.skillIdsUsed).toEqual(['skill-1', 'skill-2']);
  });

  it('should throw ValidationError when specializationIds exceeds max 3', async () => {
    await expect(
      updateTask({
        id: '507f1f77bcf86cd799439011',
        specializationIds: ['spec-1', 'spec-2', 'spec-3', 'spec-4'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when neither title, category, nor specializationIds is provided', async () => {
    await expect(updateTask({ id: '507f1f77bcf86cd799439011' })).rejects.toThrow(ValidationError);
  });

  it('should throw NotFoundError when task is not found', async () => {
    mockPersist.mockRejectedValue(
      new NotFoundError('Instance with id 507f1f77bcf86cd799439099 not found'),
    );

    await expect(
      updateTask({ id: '507f1f77bcf86cd799439099', title: 'Title' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when title is empty', async () => {
    await expect(updateTask({ id: '507f1f77bcf86cd799439011', title: '' })).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when title exceeds 120 characters', async () => {
    await expect(
      updateTask({ id: '507f1f77bcf86cd799439011', title: 'x'.repeat(121) }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when id is not a valid ObjectId', async () => {
    await expect(updateTask({ id: 'task-1', title: 'Title' })).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when id is empty', async () => {
    await expect(updateTask({ id: '', title: 'Title' })).rejects.toThrow(ValidationError);
  });
});
