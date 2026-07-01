import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const { mockUpdateTask } = vi.hoisted(() => ({
  mockUpdateTask: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    commands: {
      updateTask: mockUpdateTask,
    },
  },
}));

import { updateTaskToolHandler } from './index';

describe('updateTask internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateTask.mockResolvedValue({ data: { id: 'task-1' } });
  });

  it('should update specializationIds when provided', async () => {
    const result = await updateTaskToolHandler({
      taskId: 'task-1',
      specializationIds: ['spec-1', 'spec-2'],
    });

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      specializationIds: ['spec-1', 'spec-2'],
    });
    expect(result).toBe('Updated specializationIds for task task-1');
  });

  it('should throw ValidationError when specializationIds exceeds max 3', async () => {
    await expect(
      updateTaskToolHandler({
        taskId: 'task-1',
        specializationIds: ['spec-1', 'spec-2', 'spec-3', 'spec-4'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should update skillIdsUsed when provided', async () => {
    const result = await updateTaskToolHandler({
      taskId: 'task-1',
      skillIdsUsed: ['skill-1', 'skill-2'],
    });

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      skillIdsUsed: ['skill-1', 'skill-2'],
    });
    expect(result).toBe('Updated skillIdsUsed for task task-1');
  });

  it('should throw ValidationError when no update fields are provided', async () => {
    await expect(updateTaskToolHandler({ taskId: 'task-1' })).rejects.toThrow(ValidationError);
  });
});
