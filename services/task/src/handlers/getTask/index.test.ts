import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, ValidationError, WrongParamError } from '@vassembly/errors';
import { TaskStatus, TaskType } from '@vassembly/domain-task';
import type { TaskResponse } from '@vassembly/domain-task';

const { mockGetById } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    commands: {},
    queries: {
      getById: mockGetById,
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

import { getTask } from './index';

const buildTaskResponse = (): TaskResponse => ({
  id: '507f1f77bcf86cd799439011',
  userId: 'user-auth',
  description: 'Review quarterly report',
  type: TaskType.User,
  status: TaskStatus.Created,
  agentAssignedId: null,
  specializationIds: null,
  skillIdsUsed: null,
  title: null,
  category: null,
  activeCommentId: null,
  errorMessage: null,
  errorCode: null,
  startedAt: null,
  completedAt: null,
  failedAt: null,
  pausedAt: null,
  createdAt: '2026-05-26T12:00:00.000Z',
  updatedAt: '2026-05-26T12:00:00.000Z',
});

describe('getTask handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success flows', () => {
    it('should return TaskResponse when domain getById resolves for taskId and userId', async () => {
      const taskResponse = buildTaskResponse();
      mockGetById.mockResolvedValue({ data: taskResponse });

      const result = await getTask({
        userId: 'user-auth',
        taskId: '507f1f77bcf86cd799439011',
      });

      expect(result).toEqual(taskResponse);
    });

    it('should delegate to taskDomain queries getById with taskId and userId', async () => {
      mockGetById.mockResolvedValue({ data: buildTaskResponse() });

      await getTask({
        userId: 'user-auth',
        taskId: '507f1f77bcf86cd799439011',
      });

      expect(mockGetById).toHaveBeenCalledWith({
        id: '507f1f77bcf86cd799439011',
        userId: 'user-auth',
      });
    });
  });

  describe('validation', () => {
    it('should throw ValidationError when userId is missing from handler input', async () => {
      await expect(
        getTask({
          userId: '',
          taskId: '507f1f77bcf86cd799439011',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when taskId is missing from handler input', async () => {
      await expect(
        getTask({
          userId: 'user-auth',
          taskId: '',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('error flows', () => {
    it('should propagate NotFoundError from domain getById', async () => {
      mockGetById.mockRejectedValue(new NotFoundError('Task not found'));

      await expect(
        getTask({
          userId: 'user-auth',
          taskId: '507f1f77bcf86cd799439011',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should propagate WrongParamError from domain getById', async () => {
      mockGetById.mockRejectedValue(new WrongParamError('Invalid task id'));

      await expect(
        getTask({
          userId: 'user-auth',
          taskId: 'not-a-valid-id',
        }),
      ).rejects.toThrow(WrongParamError);
    });
  });
});
