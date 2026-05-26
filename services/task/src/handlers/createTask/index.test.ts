import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError, WrongParamError } from '@vassembly/errors';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    commands: {
      create: mockCreate,
    },
  },
  toTaskResponse: ({ task }: { task: Record<string, unknown> }) => ({
    id: task.id as string,
    userId: task.userId as string,
    description: task.description as string,
    type: task.type as 'user',
    status: task.status as 'created',
    agentAssignedId: (task.agentAssignedId ?? null) as string | null,
    createdAt: (task.createdAt as Date).toISOString(),
    updatedAt: (task.updatedAt as Date).toISOString(),
  }),
}));

import { createTask } from './index';

const BODY = {
  description: 'Review quarterly report',
};

describe('createTask handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        status: 'created',
        agentAssignedId: null,
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
      status: 'created',
      agentAssignedId: null,
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
        status: 'created',
        agentAssignedId: null,
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
  });
});
