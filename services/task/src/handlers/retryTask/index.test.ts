import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, NotFoundError } from '@vassembly/errors';

const {
  mockGetModelById,
  mockRetryTaskCommand,
  mockExecuteTask,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockRetryTaskCommand: vi.fn(),
  mockExecuteTask: vi.fn(),
  mockLogger: vi.fn(),
}));

vi.mock('../executeTask', () => ({
  executeTask: mockExecuteTask,
  TaskExecutionMode: {
    Fresh: 'fresh',
    Resume: 'resume',
    Retry: 'retry',
  },
}));

vi.mock('@vassembly/logger', () => ({
  logger: mockLogger,
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: {
      getModelById: mockGetModelById,
    },
    commands: {
      retryTask: mockRetryTaskCommand,
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
    errorMessage: (task.errorMessage ?? null) as string | null,
    errorCode: (task.errorCode ?? null) as string | null,
    startedAt: task.startedAt ? (task.startedAt as Date).toISOString() : null,
    completedAt: null,
    failedAt: task.failedAt ? (task.failedAt as Date).toISOString() : null,
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

import { retryTask } from './index';

const BASE_TASK = {
  id: 'task-1',
  userId: 'user-1',
  description: 'Summarize report',
  type: 'user',
  agentAssignedId: 'agent-1',
  createdAt: new Date('2026-06-16T08:00:00.000Z'),
  updatedAt: new Date('2026-06-16T09:00:00.000Z'),
};

describe('retryTask handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteTask.mockResolvedValue(undefined);
  });

  it('should return in-progress task with cleared error fields when task is paused', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'paused',
        pausedAt: new Date('2026-06-16T09:00:00.000Z'),
      },
    });
    mockRetryTaskCommand.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'in-progress',
        errorMessage: null,
        errorCode: null,
        failedAt: null,
        pausedAt: new Date('2026-06-16T09:00:00.000Z'),
      },
    });

    const result = await retryTask({ userId: 'user-1', taskId: 'task-1' });

    expect(result.task.status).toBe('in-progress');
    expect(result.task.errorMessage).toBeNull();
    expect(result.task.errorCode).toBeNull();
    expect(result.task.failedAt).toBeNull();
  });

  it('should return in-progress task with cleared error fields when task is failed', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'failed',
        errorMessage: 'Provider timeout',
        errorCode: 'PROVIDER_TIMEOUT',
        failedAt: new Date('2026-06-16T09:30:00.000Z'),
      },
    });
    mockRetryTaskCommand.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'in-progress',
        errorMessage: null,
        errorCode: null,
        failedAt: null,
      },
    });

    const result = await retryTask({ userId: 'user-1', taskId: 'task-1' });

    expect(result.task.status).toBe('in-progress');
    expect(result.task.errorMessage).toBeNull();
    expect(result.task.errorCode).toBeNull();
    expect(result.task.failedAt).toBeNull();
  });

  it('should throw NotFoundError when task is not owned by requesting user', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'paused',
        userId: 'other-user',
      },
    });

    await expect(retryTask({ userId: 'user-1', taskId: 'task-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ConflictError with TASK_NOT_RETRYABLE when task is in-progress', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'in-progress',
      },
    });

    await expect(retryTask({ userId: 'user-1', taskId: 'task-1' })).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ConflictError &&
        (error.error as { code?: string } | undefined)?.code === 'TASK_NOT_RETRYABLE'
      );
    });
  });

  it('should trigger executeTask with retry mode after successful retry from paused state', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'paused',
      },
    });
    mockRetryTaskCommand.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'in-progress',
        errorMessage: null,
        errorCode: null,
        failedAt: null,
      },
    });

    await retryTask({ userId: 'user-1', taskId: 'task-1' });

    expect(mockExecuteTask).toHaveBeenCalledTimes(1);
    expect(mockExecuteTask).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      mode: 'retry',
    });
  });
});
