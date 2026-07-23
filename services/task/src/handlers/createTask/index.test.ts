import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError, WrongParamError } from '@vassembly/errors';

const { mockCreate, mockGetActiveByName, mockExecuteTask, mockGenerateTaskTitle, mockGenerateTaskCategory, mockCommentCreate, mockInitProgress, mockMarkInProgress } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetActiveByName: vi.fn(),
  mockExecuteTask: vi.fn(),
  mockGenerateTaskTitle: vi.fn(),
  mockGenerateTaskCategory: vi.fn(),
  mockCommentCreate: vi.fn(),
  mockInitProgress: vi.fn(),
  mockMarkInProgress: vi.fn(),
}));

vi.mock('../executeTask', () => ({
  executeTask: mockExecuteTask,
}));

vi.mock('../generateTaskCategory', () => ({
  generateTaskCategory: mockGenerateTaskCategory,
}));

vi.mock('../generateTaskTitle', () => ({
  generateTaskTitle: mockGenerateTaskTitle,
}));

vi.mock('@vassembly/logger', () => ({
  logger: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: {
      getActiveByName: mockGetActiveByName,
    },
  },
}));

vi.mock('@vassembly/domain-task-comment', () => ({
  default: {
    commands: {
      create: mockCommentCreate,
    },
  },
}));

vi.mock('@vassembly/domain-task-progress', () => ({
  default: {
    commands: {
      initializeTaskProgress: mockInitProgress,
    },
  },
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    commands: {
      create: mockCreate,
      markInProgress: mockMarkInProgress,
    },
  },
  toTaskResponse: ({ task }: { task: Record<string, unknown> }) => ({
    id: task.id as string,
    userId: task.userId as string,
    description: task.description as string,
    type: task.type as 'user',
    status: task.status as 'in-progress',
    agentAssignedId: (task.agentAssignedId ?? null) as string | null,
    title: null,
    activeCommentId: null,
    errorMessage: null,
    errorCode: null,
    startedAt: task.startedAt ? (task.startedAt as Date).toISOString() : null,
    completedAt: null,
    failedAt: null,
    createdAt: (task.createdAt as Date).toISOString(),
    updatedAt: (task.updatedAt as Date).toISOString(),
  }),
}));

import { createTask } from './index';

const BODY = {
  description: 'Review quarterly report',
};

const ASSISTANT_AGENT_ID = 'assistant-agent-id';

describe('createTask handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveByName.mockResolvedValue({
      data: { id: ASSISTANT_AGENT_ID },
    });
    mockCommentCreate.mockResolvedValue({
      data: { id: 'comment-1', userText: BODY.description },
    });
    mockInitProgress.mockResolvedValue(undefined);
    mockMarkInProgress.mockResolvedValue(undefined);
    mockExecuteTask.mockResolvedValue(undefined);
    mockGenerateTaskTitle.mockResolvedValue(undefined);
    mockGenerateTaskCategory.mockResolvedValue(undefined);
  });

  it('should return TaskResponse with serialized id and ISO timestamps when create succeeds', async () => {
    const createdAt = new Date('2026-05-26T12:00:00.000Z');
    const updatedAt = new Date('2026-05-26T12:00:00.000Z');

    mockCreate.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439011',
        userId: 'user-auth',
        description: BODY.description,
        type: 'user',
        status: 'in-progress',
        agentAssignedId: ASSISTANT_AGENT_ID,
        createdAt,
        updatedAt,
      },
    });

    const result = await createTask({ userId: 'user-auth', body: BODY });

    expect(result.task).toEqual({
      id: '507f1f77bcf86cd799439011',
      userId: 'user-auth',
      description: BODY.description,
      type: 'user',
      status: 'in-progress',
      agentAssignedId: ASSISTANT_AGENT_ID,
      title: null,
      activeCommentId: null,
      errorMessage: null,
      errorCode: null,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      createdAt: '2026-05-26T12:00:00.000Z',
      updatedAt: '2026-05-26T12:00:00.000Z',
    });
  });

  it('should propagate ValidationError from domain create', async () => {
    mockCreate.mockRejectedValue(new ValidationError('Validation failed'));

    await expect(createTask({ userId: 'user-1', body: BODY })).rejects.toThrow(ValidationError);
  });

  it('should propagate WrongParamError from domain create', async () => {
    mockCreate.mockRejectedValue(new WrongParamError('Failed to create task'));

    await expect(createTask({ userId: 'user-1', body: BODY })).rejects.toThrow(WrongParamError);
  });

  it('should scope created task to authenticated userId from handler context', async () => {
    mockCreate.mockResolvedValue({
      data: {
        id: 'task-scoped',
        userId: 'user-real',
        description: BODY.description,
        type: 'user',
        status: 'in-progress',
        agentAssignedId: ASSISTANT_AGENT_ID,
        createdAt: new Date('2026-05-26T12:00:00.000Z'),
        updatedAt: new Date('2026-05-26T12:00:00.000Z'),
      },
    });

    const result = await createTask({
      userId: 'user-real',
      body: {
        description: BODY.description,
      },
    });

    expect(result.task.userId).toBe('user-real');
    expect(result.task.agentAssignedId).toBe(ASSISTANT_AGENT_ID);
  });

  it('should trigger executeTask without awaiting after create succeeds', async () => {
    mockCreate.mockResolvedValue({
      data: {
        id: 'task-async',
        userId: 'user-auth',
        description: BODY.description,
        type: 'user',
        status: 'in-progress',
        agentAssignedId: ASSISTANT_AGENT_ID,
        startedAt: new Date('2026-05-26T12:00:00.000Z'),
        createdAt: new Date('2026-05-26T12:00:00.000Z'),
        updatedAt: new Date('2026-05-26T12:00:00.000Z'),
      },
    });

    await createTask({ userId: 'user-auth', body: BODY });

    expect(mockExecuteTask).toHaveBeenCalledTimes(1);
    expect(mockExecuteTask).toHaveBeenCalledWith({
      taskId: 'task-async',
      userId: 'user-auth',
      commentId: 'comment-1',
    });
    expect(mockMarkInProgress).toHaveBeenCalledWith({
      taskId: 'task-async',
      activeCommentId: 'comment-1',
    });
  });
});
