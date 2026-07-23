import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, NotFoundError } from '@vassembly/errors';

const {
  mockGetModelById,
  mockResumeTaskCommand,
  mockExecuteTask,
  mockGetTaskProgressByTaskId,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockResumeTaskCommand: vi.fn(),
  mockExecuteTask: vi.fn(),
  mockGetTaskProgressByTaskId: vi.fn(),
  mockLogger: vi.fn(),
}));

vi.mock('../executeTask/resolveActiveCommentId', () => ({
  resolveActiveCommentId: vi.fn().mockResolvedValue('comment-1'),
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

vi.mock('@vassembly/domain-task-progress', () => ({
  default: {
    queries: {
      getModelByTaskId: mockGetTaskProgressByTaskId,
    },
  },
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: {
      getModelById: mockGetModelById,
    },
    commands: {
      resumeTask: mockResumeTaskCommand,
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

import { resumeTask } from './index';

const BASE_TASK = {
  id: 'task-1',
  userId: 'user-1',
  description: 'Summarize report',
  type: 'user',
  status: 'paused',
  agentAssignedId: 'agent-1',
  pausedAt: new Date('2026-06-16T09:00:00.000Z'),
  createdAt: new Date('2026-06-16T08:00:00.000Z'),
  updatedAt: new Date('2026-06-16T09:00:00.000Z'),
};

describe('resumeTask handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteTask.mockResolvedValue(undefined);
    mockGetTaskProgressByTaskId.mockResolvedValue({ data: { events: [] } });
  });

  it('should return task with in-progress status when task is paused and owned by user', async () => {
    mockGetModelById.mockResolvedValue({ data: BASE_TASK });
    mockResumeTaskCommand.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'in-progress',
      },
    });

    const result = await resumeTask({ userId: 'user-1', taskId: 'task-1' });

    expect(result.task.status).toBe('in-progress');
    expect(result.task.id).toBe('task-1');
  });

  it('should throw NotFoundError when task is not owned by requesting user', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        userId: 'other-user',
      },
    });

    await expect(resumeTask({ userId: 'user-1', taskId: 'task-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw ConflictError with TASK_NOT_RESUMABLE when task is not paused', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'failed',
      },
    });

    await expect(resumeTask({ userId: 'user-1', taskId: 'task-1' })).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ConflictError &&
        (error.error as { code?: string } | undefined)?.code === 'TASK_NOT_RESUMABLE'
      );
    });
  });

  it('should trigger executeTask with resume mode when progress has completed events', async () => {
    mockGetModelById.mockResolvedValue({ data: BASE_TASK });
    mockResumeTaskCommand.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'in-progress',
      },
    });
    mockGetTaskProgressByTaskId.mockResolvedValue({
      data: {
        events: [
          {
            state: 'completed',
            agentId: 'agent-1',
            inputMessages: 'Step input',
            generatedResponse: 'Step output',
          },
        ],
      },
    });

    await resumeTask({ userId: 'user-1', taskId: 'task-1' });

    expect(mockExecuteTask).toHaveBeenCalledTimes(1);
    expect(mockExecuteTask).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      commentId: 'comment-1',
      mode: 'resume',
    });
  });

  it('should trigger executeTask with resume mode when progress has no completed events', async () => {
    mockGetModelById.mockResolvedValue({ data: BASE_TASK });
    mockResumeTaskCommand.mockResolvedValue({
      data: {
        ...BASE_TASK,
        status: 'in-progress',
      },
    });
    mockGetTaskProgressByTaskId.mockResolvedValue({
      data: {
        events: [{ state: 'started', agentId: 'agent-1' }],
      },
    });

    await resumeTask({ userId: 'user-1', taskId: 'task-1' });

    expect(mockExecuteTask).toHaveBeenCalledTimes(1);
    expect(mockExecuteTask).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      commentId: 'comment-1',
      mode: 'resume',
    });
  });
});
