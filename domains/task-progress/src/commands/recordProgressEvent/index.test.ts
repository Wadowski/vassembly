import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

import { recordProgressEvent } from './index';
import { mongoDb } from '@vassembly/client-mongodb';
import { ProgressEventState } from '../../model';

const mockCollection = {
  updateOne: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as any).mockReturnValue(mockCollection);
});

describe('recordProgressEvent', () => {
  describe('success cases', () => {
    it('should append event to events array with started state', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Started,
      });

      expect(result).toBeDefined();
      expect(result.agentId).toBe('agent-123');
      expect(result.state).toBe(ProgressEventState.Started);
      expect(result.timestamp).toBeDefined();
      expect(result.id).toBeDefined();
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { taskId: 'task-123' },
        expect.objectContaining({
          $push: expect.objectContaining({
            events: expect.any(Object),
          }),
        })
      );
    });

    it('should append event with completed state and duration', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Completed,
        duration: 5000,
      });

      expect(result.state).toBe(ProgressEventState.Completed);
      expect(result.duration).toBe(5000);
    });

    it('should append event with failed state and error details', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const errorDetails = {
        message: 'Connection timeout',
        type: 'TimeoutError',
        stackTrace: 'at invokeAgent line 123',
      };

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Failed,
        errorDetails,
      });

      expect(result.state).toBe(ProgressEventState.Failed);
      expect(result.errorDetails).toEqual(errorDetails);
    });

    it('should include token usage when provided', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const tokenUsage = { input: 100, output: 50, total: 150 };

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Completed,
        tokenUsage,
      });

      expect(result.tokenUsage).toEqual(tokenUsage);
    });

    it('should include integration fields when provided', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Started,
        integrationName: 'My OpenAI',
        provider: 'chatgpt',
        model: 'gpt-4o',
      });

      expect(result.integrationName).toBe('My OpenAI');
      expect(result.provider).toBe('chatgpt');
      expect(result.model).toBe('gpt-4o');
    });

    it('should include parentAgentId when provided', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        parentAgentId: 'parent-agent-1',
        state: ProgressEventState.Started,
      });

      expect(result.parentAgentId).toBe('parent-agent-1');
    });

    it('should include input and generated messages when provided', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const inputMessages = JSON.stringify({ prompt: 'test prompt' });
      const generatedResponse = JSON.stringify({ result: 'test result' });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Completed,
        inputMessages,
        generatedResponse,
      });

      expect(result.inputMessages).toBe(inputMessages);
      expect(result.generatedResponse).toBe(generatedResponse);
    });

    it('should use provided timestamp instead of current time', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const customTimestamp = new Date('2026-06-15T10:00:00Z');

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Started,
        timestamp: customTimestamp,
      });

      expect(result.timestamp).toEqual(customTimestamp);
    });

    it('should use $push operator for atomic append (concurrency safe)', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Started,
      });

      const callArgs = mockCollection.updateOne.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('$push');
    });

    it('should handle multiple events with different states', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const startedEvent = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Started,
      });
      expect(startedEvent.state).toBe(ProgressEventState.Started);

      const completedEvent = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Completed,
        duration: 1000,
      });
      expect(completedEvent.state).toBe(ProgressEventState.Completed);

      const failedEvent = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Failed,
        errorDetails: { message: 'test error' },
      });
      expect(failedEvent.state).toBe(ProgressEventState.Failed);
    });
  });

  describe('optional fields', () => {
    it('should handle missing optional duration field', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Started,
      });

      expect(result.duration).toBeUndefined();
    });

    it('should handle missing optional tokenUsage field', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Started,
      });

      expect(result.tokenUsage).toBeUndefined();
    });

    it('should handle missing optional errorDetails field', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Completed,
      });

      expect(result.errorDetails).toBeUndefined();
    });

    it('should handle missing optional inputMessages field', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Completed,
      });

      expect(result.inputMessages).toBeUndefined();
    });

    it('should handle missing optional generatedResponse field', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await recordProgressEvent({
        taskId: 'task-123',
        agentId: 'agent-123',
        state: ProgressEventState.Completed,
      });

      expect(result.generatedResponse).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should reject empty taskId', async () => {
      await expect(
        recordProgressEvent({
          taskId: '',
          agentId: 'agent-123',
          state: ProgressEventState.Started,
        })
      ).rejects.toThrow();
    });

    it('should reject empty agentId', async () => {
      await expect(
        recordProgressEvent({
          taskId: 'task-123',
          agentId: '',
          state: ProgressEventState.Started,
        })
      ).rejects.toThrow();
    });

    it('should reject invalid state', async () => {
      await expect(
        recordProgressEvent({
          taskId: 'task-123',
          agentId: 'agent-123',
          state: 'invalid-state' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw NotFoundError when task progress document does not exist', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 0,
        modifiedCount: 0,
      });

      await expect(
        recordProgressEvent({
          taskId: 'nonexistent-task',
          agentId: 'agent-123',
          state: ProgressEventState.Started,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should propagate MongoDB update errors', async () => {
      mockCollection.updateOne.mockRejectedValue(new Error('MongoDB error'));

      await expect(
        recordProgressEvent({
          taskId: 'task-123',
          agentId: 'agent-123',
          state: ProgressEventState.Started,
        })
      ).rejects.toThrow('MongoDB error');
    });

    it('should throw NotFoundError with descriptive message when document not found', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 0,
        modifiedCount: 0,
      });

      await expect(
        recordProgressEvent({
          taskId: 'task-456',
          agentId: 'agent-123',
          state: ProgressEventState.Started,
        })
      ).rejects.toThrow('Task progress not found for taskId: task-456');
    });
  });
});
