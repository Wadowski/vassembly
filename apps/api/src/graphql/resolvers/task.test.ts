import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TaskStatus, TaskType, toTaskResponse } from '@vassembly/domain-task';
import type { TaskModel } from '@vassembly/domain-task';
import { UnauthorizedError, ValidationError } from '@vassembly/errors';
import type { Builder } from '@vassembly/graphql';

const { mockListUserTasks } = vi.hoisted(() => ({
  mockListUserTasks: vi.fn(),
}));

vi.mock('@vassembly/service-task', () => ({
  default: {
    listUserTasks: mockListUserTasks,
  },
}));

import { registerTaskResolvers } from './task';

type UserTasksResolver = (
  root: unknown,
  args: { page?: number | null; size?: number | null; search?: string | null },
  context: { authenticatedUserId?: string },
) => Promise<{
  items: Array<ReturnType<typeof toTaskResponse>>;
  totalCount: number;
  page: number;
  size: number;
}>;

const captureUserTasksResolver = (): UserTasksResolver => {
  let resolve: UserTasksResolver | undefined;

  const arg = {
    int: (config: unknown) => config,
    string: (config: unknown) => config,
  };

  const builder = {
    queryFields: (fieldsFactory: (t: {
      field: (config: { resolve: UserTasksResolver }) => void;
      arg: typeof arg;
    }) => void) => {
      fieldsFactory({
        field: (config) => {
          resolve = config.resolve;
        },
        arg,
      });
    },
  } as unknown as Builder;

  registerTaskResolvers(builder);

  if (resolve === undefined) {
    throw new Error('userTasks resolver was not registered');
  }

  return resolve;
};

const buildTaskModel = (partial: Partial<TaskModel> = {}): TaskModel =>
  ({
    id: partial.id ?? 'task-1',
    userId: partial.userId ?? 'user-auth',
    description: partial.description ?? 'Review quarterly report',
    type: partial.type ?? TaskType.User,
    status: partial.status ?? TaskStatus.Created,
    agentAssignedId: partial.agentAssignedId ?? null,
    title: partial.title ?? null,
    createdAt: partial.createdAt ?? new Date('2026-05-26T12:00:00.000Z'),
    updatedAt: partial.updatedAt ?? new Date('2026-05-26T12:00:00.000Z'),
  }) as TaskModel;

describe('registerTaskResolvers userTasks', () => {
  let resolveUserTasks: UserTasksResolver;

  beforeEach(() => {
    vi.clearAllMocks();
    resolveUserTasks = captureUserTasksResolver();
  });

  describe('success flows', () => {
    it('should return mapped tasks list for authenticated users', async () => {
      mockListUserTasks.mockResolvedValue({
        items: [buildTaskModel({ id: 'task-1', status: TaskStatus.Created })],
        totalCount: 1,
        page: 0,
        size: 10,
      });

      const result = await resolveUserTasks(
        {},
        { page: 0, size: 10, search: null },
        { authenticatedUserId: 'user-auth' },
      );

      expect(result).toEqual({
        items: [
          expect.objectContaining({
            id: 'task-1',
            status: 'created',
            title: null,
          }),
        ],
        totalCount: 1,
        page: 0,
        size: 10,
      });
    });

    it('should return empty mapped list with pagination metadata when no tasks exist', async () => {
      mockListUserTasks.mockResolvedValue({
        items: [],
        totalCount: 0,
        page: 2,
        size: 5,
      });

      const result = await resolveUserTasks(
        {},
        { page: 2, size: 5, search: 'invoice' },
        { authenticatedUserId: 'user-auth' },
      );

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.page).toBe(2);
      expect(result.size).toBe(5);
    });

    it('should expose status badge values on mapped task items', async () => {
      mockListUserTasks.mockResolvedValue({
        items: [
          buildTaskModel({ id: 'created-task', status: TaskStatus.Created }),
          buildTaskModel({ id: 'progress-task', status: TaskStatus.InProgress }),
          buildTaskModel({ id: 'done-task', status: TaskStatus.Done }),
          buildTaskModel({ id: 'failed-task', status: TaskStatus.Failed }),
        ],
        totalCount: 4,
        page: 0,
        size: 10,
      });

      const result = await resolveUserTasks({}, { page: 0, size: 10 }, { authenticatedUserId: 'user-auth' });

      expect(result.items.map((item) => item.status)).toEqual([
        'created',
        'in-progress',
        'done',
        'failed',
      ]);
    });

    it('should expose nullable title on mapped task items', async () => {
      mockListUserTasks.mockResolvedValue({
        items: [
          buildTaskModel({ id: 'with-summary', title: 'Parsed invoices' }),
          buildTaskModel({ id: 'without-summary', title: null }),
        ],
        totalCount: 2,
        page: 0,
        size: 10,
      });

      const result = await resolveUserTasks({}, { page: 0, size: 10 }, { authenticatedUserId: 'user-auth' });

      expect(result.items[0]?.title).toBe('Parsed invoices');
      expect(result.items[1]?.title).toBeNull();
    });
  });

  describe('error flows', () => {
    it('should throw UnauthorizedError when authenticatedUserId is missing', async () => {
      await expect(resolveUserTasks({}, { page: 0, size: 10 }, {})).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when authenticatedUserId is undefined in context', async () => {
      await expect(
        resolveUserTasks({}, { page: 0, size: 10 }, { authenticatedUserId: undefined }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should propagate service handler errors', async () => {
      mockListUserTasks.mockRejectedValue(new ValidationError('Invalid page'));

      await expect(
        resolveUserTasks({}, { page: -1, size: 10 }, { authenticatedUserId: 'user-auth' }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
