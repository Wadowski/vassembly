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

import type { InternalToolContext } from '../types';

const TASK_ID = '507f1f77bcf86cd799439011';

describe('updateTask internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateTask.mockResolvedValue({ data: { id: TASK_ID } });
  });

  it('should update specializationIds when provided', async () => {
    const result = await updateTaskToolHandler({
      taskId: TASK_ID,
      specializationIds: ['spec-1', 'spec-2'],
    });

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      specializationIds: ['spec-1', 'spec-2'],
    });
    expect(result).toBe(`Updated specializationIds for task ${TASK_ID}`);
  });

  it('should prefer context.taskId over invalid args.taskId when syncing specializationIds', async () => {
    const context: InternalToolContext = {
      userId: 'user-1',
      taskId: TASK_ID,
      commentId: 'comment-1',
      invocationId: 'inv-1',
      callerAgentId: 'agent-1',
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'root-1',
      specializationIds: null,
    };

    await updateTaskToolHandler(
      {
        taskId: 'invalid-task-id',
        specializationIds: ['spec-1'],
      },
      context,
    );

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      specializationIds: ['spec-1'],
    });
  });

  it('should prefer context.taskId over invalid args.id when syncing specializationIds', async () => {
    const context: InternalToolContext = {
      userId: 'user-1',
      taskId: TASK_ID,
      commentId: 'comment-1',
      invocationId: 'inv-1',
      callerAgentId: 'agent-1',
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'root-1',
      specializationIds: null,
    };

    await updateTaskToolHandler(
      {
        id: 'legal',
        specializationIds: ['spec-1'],
      },
      context,
    );

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      specializationIds: ['spec-1'],
    });
  });

  it('should update context specializationIds when context is provided', async () => {
    const context: InternalToolContext = {
      userId: 'user-1',
      taskId: TASK_ID,
      commentId: 'comment-1',
      invocationId: 'inv-1',
      callerAgentId: 'agent-1',
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'root-1',
      specializationIds: null,
    };

    await updateTaskToolHandler(
      {
        taskId: TASK_ID,
        specializationIds: ['spec-1'],
      },
      context,
    );

    expect(context.specializationIds).toEqual(['spec-1']);
  });

  it('should use context.taskId when updating category with invalid args.taskId', async () => {
    const context: InternalToolContext = {
      userId: 'user-1',
      taskId: TASK_ID,
      commentId: 'comment-1',
      invocationId: 'inv-1',
      callerAgentId: 'agent-1',
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'root-1',
    };

    await updateTaskToolHandler(
      {
        taskId: 'invalid-task-id',
        category: 'task',
      },
      context,
    );

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      category: 'task',
    });
  });

  it('should map legacy disabled category slugs to task', async () => {
    const context: InternalToolContext = {
      userId: 'user-1',
      taskId: TASK_ID,
      commentId: 'comment-1',
      invocationId: 'inv-1',
      callerAgentId: 'agent-1',
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'root-1',
    };

    await updateTaskToolHandler(
      {
        category: 'question',
      },
      context,
    );

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      category: 'task',
    });
  });

  it('should coerce unrecognized category values to task', async () => {
    const context: InternalToolContext = {
      userId: 'user-1',
      taskId: TASK_ID,
      commentId: 'comment-1',
      invocationId: 'inv-1',
      callerAgentId: 'agent-1',
      callerAgentType: 'system',
      recursionDepth: 0,
      rootInvokeId: 'root-1',
    };

    await updateTaskToolHandler(
      {
        category: 'action',
      },
      context,
    );

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      category: 'task',
    });
  });

  it('should throw ValidationError when specializationIds exceeds max 3', async () => {
    await expect(
      updateTaskToolHandler({
        taskId: TASK_ID,
        specializationIds: ['spec-1', 'spec-2', 'spec-3', 'spec-4'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should update skillIdsUsed when provided', async () => {
    const result = await updateTaskToolHandler({
      taskId: TASK_ID,
      skillIdsUsed: ['skill-1', 'skill-2'],
    });

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      skillIdsUsed: ['skill-1', 'skill-2'],
    });
    expect(result).toBe(`Updated skillIdsUsed for task ${TASK_ID}`);
  });

  it('should throw ValidationError when no update fields are provided', async () => {
    await expect(updateTaskToolHandler({ taskId: TASK_ID })).rejects.toThrow(ValidationError);
  });
});
