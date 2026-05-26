import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError, WrongParamError } from '@vassembly/errors';
import { TaskStatus, TaskType } from '@vassembly/domain-task';

const { mockListUserTasks } = vi.hoisted(() => ({
  mockListUserTasks: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    commands: {},
    queries: {
      listUserTasks: mockListUserTasks,
    },
  },
  TaskStatus: {
    Created: 'created',
    InProgress: 'in-progress',
    Done: 'done',
    Failed: 'failed',
  },
  TaskType: {
    User: 'user',
    Agent: 'agent',
  },
}));

import { listUserTasks } from './index';

const buildTaskModel = () => ({
  id: 'task-1',
  userId: 'user-auth',
  description: 'Review quarterly report',
  type: TaskType.User,
  status: TaskStatus.Created,
  agentAssignedId: null,
  createdAt: new Date('2026-05-26T12:00:00.000Z'),
  updatedAt: new Date('2026-05-26T12:00:00.000Z'),
});

describe('listUserTasks handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success flows', () => {
    it('should return paginated tasks scoped to the authenticated userId', async () => {
      mockListUserTasks.mockResolvedValue({
        items: [buildTaskModel()],
        totalCount: 1,
        page: 0,
        size: 10,
      });

      const result = await listUserTasks({
        userId: 'user-auth',
        page: 0,
        size: 10,
      });

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.userId).toBe('user-auth');
      expect(result.page).toBe(0);
      expect(result.size).toBe(10);
    });

    it('should return search-filtered paginated results from the domain query', async () => {
      mockListUserTasks.mockResolvedValue({
        items: [],
        totalCount: 0,
        page: 1,
        size: 5,
      });

      const result = await listUserTasks({
        userId: 'user-auth',
        page: 1,
        size: 5,
        search: 'invoice',
      });

      expect(result.page).toBe(1);
      expect(result.size).toBe(5);
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('error flows', () => {
    it('should propagate domain query errors', async () => {
      mockListUserTasks.mockRejectedValue(new ValidationError('Invalid pagination'));

      await expect(
        listUserTasks({
          userId: 'user-auth',
          page: 0,
          size: 10,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate WrongParamError from domain query', async () => {
      mockListUserTasks.mockRejectedValue(new WrongParamError('Invalid page'));

      await expect(
        listUserTasks({
          userId: 'user-auth',
          page: -1,
          size: 10,
        }),
      ).rejects.toThrow(WrongParamError);
    });

    it('should reject when userId is missing from handler input', async () => {
      await expect(
        listUserTasks({
          userId: '',
          page: 0,
          size: 10,
        }),
      ).rejects.toThrow();
    });
  });
});
