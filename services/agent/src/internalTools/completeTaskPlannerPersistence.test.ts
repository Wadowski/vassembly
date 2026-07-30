import { describe, expect, it, vi, beforeEach } from 'vitest';
import { InternalError } from '@vassembly/errors';

const mockIsTaskPlanPersisted = vi.hoisted(() => vi.fn());

vi.mock('./useAgent/verifyTaskPlanPersisted', () => ({
  extractPersistFailureReason: vi.fn(),
  isTaskPlanPersisted: mockIsTaskPlanPersisted,
}));

import {
  buildTaskPlannerPersistContinuationMessage,
  completeTaskPlannerPersistence,
} from './completeTaskPlannerPersistence';
import { extractPersistFailureReason } from './useAgent/verifyTaskPlanPersisted';

import type { RunAgentInvokeWithToolsResult } from './types';

const buildInvokeResult = ({
  message,
  internalToolResults,
}: {
  message: string;
  internalToolResults?: Array<{ toolId: string; content: string }>;
}): RunAgentInvokeWithToolsResult => ({
  message,
  usage: undefined,
  metadata: {
    mcpIdsUsed: [],
    skippedMcpIds: [],
    internalToolIdsUsed: [],
    skippedInternalToolIds: [],
    maxUseAgentDepth: 0,
    internalToolResults,
  },
});

describe('buildTaskPlannerPersistContinuationMessage', () => {
  it('should include the original request and planner response', () => {
    const message = buildTaskPlannerPersistContinuationMessage({
      plannerInputMessage: 'Plan this task',
      firstResultMessage: 'Step 1: review contract',
    });

    expect(message).toContain('Plan this task');
    expect(message).toContain('Step 1: review contract');
    expect(message).toContain('persist_task_plan');
  });
});

describe('completeTaskPlannerPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the first result when persistence already succeeded', async () => {
    mockIsTaskPlanPersisted.mockResolvedValueOnce(true);

    const firstResult = buildInvokeResult({ message: 'planned' });
    const continueInvocation = vi.fn();

    const result = await completeTaskPlannerPersistence({
      commentId: 'comment-1',
      plannerInputMessage: 'Plan this task',
      firstResult,
      continueInvocation,
    });

    expect(result).toBe(firstResult);
    expect(continueInvocation).not.toHaveBeenCalled();
  });

  it('should continue when persistence is missing and return continuation result on success', async () => {
    mockIsTaskPlanPersisted
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const firstResult = buildInvokeResult({ message: 'planned' });
    const continuationResult = buildInvokeResult({
      message: 'persisted',
      internalToolResults: [
        { toolId: 'task-plan-persist', content: '{"taskPlanInstanceId":"instance-1"}' },
      ],
    });
    const continueInvocation = vi.fn().mockResolvedValue(continuationResult);

    const result = await completeTaskPlannerPersistence({
      commentId: 'comment-1',
      plannerInputMessage: 'Plan this task',
      firstResult,
      continueInvocation,
    });

    expect(continueInvocation).toHaveBeenCalledWith(
      expect.stringContaining('Plan this task'),
    );
    expect(result).toBe(continuationResult);
  });

  it('should throw InternalError with persist failure reason when continuation also fails', async () => {
    mockIsTaskPlanPersisted.mockResolvedValue(false);
    vi.mocked(extractPersistFailureReason).mockReturnValue('Unknown agentName "researcher_1"');

    const firstResult = buildInvokeResult({ message: 'planned' });
    const continuationResult = buildInvokeResult({ message: 'failed persist' });
    const continueInvocation = vi.fn().mockResolvedValue(continuationResult);

    await expect(
      completeTaskPlannerPersistence({
        commentId: 'comment-1',
        plannerInputMessage: 'Plan this task',
        firstResult,
        continueInvocation,
      }),
    ).rejects.toThrow(new InternalError('Task planner failed to persist a task plan: Unknown agentName "researcher_1"'));
  });
});
