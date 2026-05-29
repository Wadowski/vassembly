import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, ValidationError } from '@vassembly/errors';

import { TaskStatus, TaskType, type TaskModel } from '../../model';
import { getById } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGet, mockFactoryCreate } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockFactoryCreate: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskMongodbDao: {
    get: mockGet,
  },
}));

vi.mock('../../model', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../model')>();
  return {
    ...actual,
    taskFactory: {
      create: mockFactoryCreate,
    },
  };
});

const TASK_ID = '507f1f77bcf86cd799439011';

const buildTaskDoc = (overrides: Partial<TaskModel> = {}): TaskModel =>
  ({
    id: TASK_ID,
    userId: 'user-1',
    description: 'Review quarterly report',
    type: TaskType.User,
    status: TaskStatus.Created,
    agentAssignedId: null,
    title: 'Quarterly report summary',
    createdAt: new Date('2026-05-26T12:00:00.000Z'),
    updatedAt: new Date('2026-05-27T08:30:00.000Z'),
    ...overrides,
  }) as TaskModel;

describe('getById task query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFactoryCreate.mockImplementation((data: Partial<TaskModel>) => data as TaskModel);
  });

  it('should throw ValidationError when userId is missing', async () => {
    await expect(
      getById({ id: TASK_ID, userId: '' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when task id is missing', async () => {
    await expect(
      getById({ id: '', userId: 'user-1' }),
    ).rejects.toThrow(ValidationError);
  });

  it('should enforce ownership scope via getModelById when userId does not match owner', async () => {
    mockGet.mockResolvedValue(buildTaskDoc({ userId: 'user-2' }));

    await expect(getById({ id: TASK_ID, userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });

  it('should map task model to TaskResponse via toTaskResponse', async () => {
    mockGet.mockResolvedValue(buildTaskDoc());

    const result = await getById({ id: TASK_ID, userId: 'user-1' });

    expect(result.data.id).toBe(TASK_ID);
    expect(result.data.userId).toBe('user-1');
    expect(result.data.description).toBe('Review quarterly report');
    expect(result.data.type).toBe(TaskType.User);
    expect(result.data.status).toBe(TaskStatus.Created);
    expect(result.data.agentAssignedId).toBeNull();
    expect(result.data.title).toBe('Quarterly report summary');
    expect(result.data.createdAt).toBe('2026-05-26T12:00:00.000Z');
    expect(result.data.updatedAt).toBe('2026-05-27T08:30:00.000Z');
  });

  it('should propagate NotFoundError from getModelById when task is missing', async () => {
    mockGet.mockResolvedValue(undefined);

    await expect(getById({ id: TASK_ID, userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });
});
