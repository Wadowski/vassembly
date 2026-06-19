import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, NotFoundError } from '@vassembly/errors';

const {
  mockGetModelById,
  mockPauseTaskCommand,
  mockAbort,
  mockDeregister,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockPauseTaskCommand: vi.fn(),
  mockAbort: vi.fn(),
  mockDeregister: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: {
      getModelById: mockGetModelById,
    },
    commands: {
      pauseTask: mockPauseTaskCommand,
    },
  },
  toTaskResponse: ({ task }: { task: Record<string, unknown> }) => ({
    id: task.id as string,
    userId: task.userId as string,
    description: task.description as string,
    type: task.type as 'user',
    status: task.status as string,
    agentAssignedId: (task.agentAssignedId ?? null) as string | null,
    title: null,
    llmResponse: null,
    errorMessage: null,
    errorCode: null,
    startedAt: task.startedAt ? (task.startedAt as Date).toISOString() : null,
    completedAt: null,
    failedAt: null,
    pausedAt: task.pausedAt ? (task.pausedAt as Date).toISOString() : null,
    createdAt: (task.createdAt as Date).toISOString(),
    updatedAt: (task.updatedAt as Date).toISOString(),
  }),
  TaskStatus: {
    InProgress: 'in-progress',
    Paused: 'paused',
    Done: 'done',
    Failed: 'failed',
  },
}));

vi.mock('../../executionRegistry', () => ({
  executionRegistry: {
    abort: mockAbort,
    deregister: mockDeregister,
  },
}));

import { pauseTask } from './index';

const BASE_TASK = {
  id: 'task-1',
  userId: 'user-1',
  description: 'Summarize report',
  type: 'user',
  status: 'in-progress',
  agentAssignedId: 'agent-1',
  createdAt: new Date('2026-06-16T08:00:00.000Z'),
  updatedAt: new Date('2026-06-16T08:00:00.000Z'),
};

describe('pauseTask handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAbort.mockReturnValue(true);
    mockDeregister.mockReturnValue(undefined);
  });

  it('should return task with paused status when task is in-progress and owned by user', async () => {
    const pausedAt = new Date('2026-06-16T10:00:00.000Z');

    mockGetModelById.mockResolvedValue({ data: BASE_TASK });
    mockPauseTaskCommand.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'paused',
        pausedAt,
      },
    });

    const result = await pauseTask({ userId: 'user-1', taskId: 'task-1' });

    expect(result.task.status).toBe('paused');
    expect(result.task.pausedAt).toBe('2026-06-16T10:00:00.000Z');
    expect(result.task.id).toBe('task-1');
  });

  it('should throw NotFoundError when task is not owned by requesting user', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        userId: 'other-user',
      },
    });

    await expect(pauseTask({ userId: 'user-1', taskId: 'task-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ConflictError with TASK_NOT_PAUSABLE when task is not in-progress', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'done',
      },
    });

    await expect(pauseTask({ userId: 'user-1', taskId: 'task-1' })).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ConflictError &&
        (error.error as { code?: string } | undefined)?.code === 'TASK_NOT_PAUSABLE'
      );
    });
  });

  it('should throw NotFoundError when task does not exist', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('Task not found'));

    await expect(pauseTask({ userId: 'user-1', taskId: 'missing-task' })).rejects.toThrow(NotFoundError);
  });
});
