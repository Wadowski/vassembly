import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError, ValidationError } from '@vassembly/errors';
import type { ProgressEventModel } from '@vassembly/domain-task-progress';

import type { RecordTaskProgressInput } from './types';

const { mockGetModelById: mockTaskGetModelById } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
}));

const { mockGetModelByTaskId, mockInitializeTaskProgress, mockRecordProgressEvent } = vi.hoisted(
  () => ({
    mockGetModelByTaskId: vi.fn(),
    mockInitializeTaskProgress: vi.fn(),
    mockRecordProgressEvent: vi.fn(),
  })
);

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: {
      getModelById: mockTaskGetModelById,
    },
  },
}));

vi.mock('@vassembly/domain-task-progress', () => ({
  default: {
    queries: {
      getModelByTaskId: mockGetModelByTaskId,
    },
    commands: {
      initializeTaskProgress: mockInitializeTaskProgress,
      recordProgressEvent: mockRecordProgressEvent,
    },
  },
}));

import { recordTaskProgress } from '.';

describe('recordTaskProgress handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should validate required fields - missing taskId', async () => {
      await expect(
        recordTaskProgress({
          taskId: '',
          userId: 'user123',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate required fields - missing userId', async () => {
      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: '',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate required fields - missing agentId', async () => {
      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: 'user123',
          agentId: '',
          state: 'started',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate required fields - missing state', async () => {
      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: 'user123',
          agentId: 'agent-123',
          state: '' as RecordTaskProgressInput['state'],
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('task ownership verification', () => {
    it('should throw NotFoundError when task does not exist', async () => {
      mockTaskGetModelById.mockResolvedValue({ data: null });

      await expect(
        recordTaskProgress({
          taskId: 'nonexistent',
          userId: 'user123',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user does not own the task', async () => {
      mockTaskGetModelById.mockResolvedValue({
        data: {
          id: 'task123',
          userId: 'different-user',
          status: 'in-progress',
        },
      });

      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: 'user123',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError with descriptive message', async () => {
      mockTaskGetModelById.mockResolvedValue({
        data: {
          id: 'task123',
          userId: 'different-user',
          status: 'in-progress',
        },
      });

      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: 'user123',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow('User does not have permission to record progress for this task');
    });

    it('should allow recording when user owns the task', async () => {
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'started',
        timestamp: new Date(),
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      const result = await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'started' as const,
      });

      expect(result).toEqual(mockEvent);
    });
  });

  describe('task progress initialization', () => {
    it('should initialize task progress if it does not exist', async () => {
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'started',
        timestamp: new Date(),
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });

      mockGetModelByTaskId.mockResolvedValueOnce({ data: null });
      mockInitializeTaskProgress.mockResolvedValue({
        id: 'progress123',
        taskId: 'task123',
        userId: 'user123',
        events: [],
      });
      mockGetModelByTaskId.mockResolvedValueOnce({
        data: {
          id: 'progress123',
          taskId: 'task123',
          userId: 'user123',
          events: [],
        },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      const result = await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'started' as const,
      });

      expect(mockInitializeTaskProgress).toHaveBeenCalledWith({
        taskId: 'task123',
        userId: 'user123',
      });
      expect(result).toEqual(mockEvent);
    });

    it('should skip initialization if task progress already exists', async () => {
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'started',
        timestamp: new Date(),
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });

      mockGetModelByTaskId.mockResolvedValue({
        data: {
          id: 'progress123',
          taskId: 'task123',
          userId: 'user123',
          events: [],
        },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      const result = await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'started' as const,
      });

      expect(mockInitializeTaskProgress).not.toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should call initializeTaskProgress with correct parameters', async () => {
      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });

      mockGetModelByTaskId.mockResolvedValueOnce({ data: null });
      mockInitializeTaskProgress.mockResolvedValue({
        taskId: 'task123',
        userId: 'user123',
        events: [],
      });
      mockGetModelByTaskId.mockResolvedValueOnce({
        data: {
          taskId: 'task123',
          userId: 'user123',
          events: [],
        },
      });

      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'started',
        timestamp: new Date(),
      };
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'started' as const,
      });

      expect(mockInitializeTaskProgress).toHaveBeenCalledWith({
        taskId: 'task123',
        userId: 'user123',
      });
    });
  });

  describe('event recording', () => {
    it('should record progress event with required fields only', async () => {
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'started',
        timestamp: new Date(),
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      const result = await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'started' as const,
      });

      expect(mockRecordProgressEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task123',
          agentId: 'agent-123',
          state: 'started',
        })
      );
      expect(result).toEqual(mockEvent);
    });

    it('should record progress event with all optional fields', async () => {
      const now = new Date();
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'completed',
        timestamp: now,
        duration: 5000,
        inputMessages: '{"prompt": "test"}',
        generatedResponse: '{"result": "test"}',
        tokenUsage: { input: 100, output: 50, total: 150 },
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { id: 'progress123', taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      const result = await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'completed' as const,
        timestamp: now,
        duration: 5000,
        inputMessages: '{"prompt": "test"}',
        generatedResponse: '{"result": "test"}',
        tokenUsage: { input: 100, output: 50, total: 150 },
      });

      expect(mockRecordProgressEvent).toHaveBeenCalledWith({
        taskId: 'task123',
        agentId: 'agent-123',
        state: 'completed',
        timestamp: now,
        duration: 5000,
        inputMessages: '{"prompt": "test"}',
        generatedResponse: '{"result": "test"}',
        tokenUsage: { input: 100, output: 50, total: 150 },
        errorDetails: undefined,
      });
      expect(result).toEqual(mockEvent);
    });

    it('should record error details when state is failed', async () => {
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'failed',
        timestamp: new Date(),
        duration: 1000,
        errorDetails: {
          message: 'Connection timeout',
          type: 'TimeoutError',
          stackTrace: 'at line 123',
        },
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { id: 'progress123', taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      const result = await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'failed' as const,
        errorDetails: {
          message: 'Connection timeout',
          type: 'TimeoutError',
          stackTrace: 'at line 123',
        },
      });

      expect(mockRecordProgressEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'failed',
          errorDetails: {
            message: 'Connection timeout',
            type: 'TimeoutError',
            stackTrace: 'at line 123',
          },
        })
      );
      expect(result).toEqual(mockEvent);
    });

    it('should use current timestamp if not provided', async () => {
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'started',
        timestamp: expect.any(Date),
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { id: 'progress123', taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'started' as const,
      });

      expect(mockRecordProgressEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task123',
          agentId: 'agent-123',
          state: 'started',
          timestamp: expect.any(Date),
        })
      );
    });

    it('should pass through provided timestamp', async () => {
      const customTimestamp = new Date('2026-06-15T10:00:00Z');
      const mockEvent: ProgressEventModel = {
        id: 'event123',
        agentId: 'agent-123',
        state: 'started',
        timestamp: customTimestamp,
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { id: 'progress123', taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'agent-123',
        state: 'started' as const,
        timestamp: customTimestamp,
      });

      expect(mockRecordProgressEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: customTimestamp,
        })
      );
    });
  });

  describe('error propagation', () => {
    it('should propagate NotFoundError from task domain query', async () => {
      mockTaskGetModelById.mockRejectedValue(
        new NotFoundError('Task not found')
      );

      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: 'user123',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should propagate errors from recordProgressEvent command', async () => {
      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockRejectedValue(
        new NotFoundError('Task progress not found')
      );

      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: 'user123',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should propagate errors from initializeTaskProgress command', async () => {
      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValueOnce({ data: null });
      mockInitializeTaskProgress.mockRejectedValue(
        new Error('MongoDB error')
      );

      await expect(
        recordTaskProgress({
          taskId: 'task123',
          userId: 'user123',
          agentId: 'agent-123',
          state: 'started',
        })
      ).rejects.toThrow('MongoDB error');
    });
  });

  describe('return value', () => {
    it('should return ProgressEventModel from command', async () => {
      const mockEvent: ProgressEventModel = {
        id: 'event-789',
        agentId: 'TestAgent',
        state: 'completed',
        timestamp: new Date(),
        duration: 2500,
        tokenUsage: { input: 50, output: 25, total: 75 },
      };

      mockTaskGetModelById.mockResolvedValue({
        data: { id: 'task123', userId: 'user123', status: 'in-progress' },
      });
      mockGetModelByTaskId.mockResolvedValue({
        data: { taskId: 'task123', userId: 'user123', events: [] },
      });
      mockRecordProgressEvent.mockResolvedValue(mockEvent);

      const result = await recordTaskProgress({
        taskId: 'task123',
        userId: 'user123',
        agentId: 'TestAgent',
        state: 'completed' as const,
        duration: 2500,
        tokenUsage: { input: 50, output: 25, total: 75 },
      });

      expect(result).toEqual(mockEvent);
      expect(result.id).toBe('event-789');
      expect(result.agentId).toBe('TestAgent');
    });
  });
});
