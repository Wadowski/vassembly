import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, TimeoutError, UserInputWaitingError, ValidationError } from '@vassembly/errors';

const {
  mockGetModelById,
  mockMarkInProgress,
  mockComplete,
  mockFail,
  mockGetPreferenceByUserId,
  mockGetTaskQuestions,
  mockGetModelByCommentId,
  mockSetAgentResponse,
  mockListByTaskId,
  mockRunAgentInvokeWithTools,
  mockFinalizeTaskProgress,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockMarkInProgress: vi.fn(),
  mockComplete: vi.fn(),
  mockFail: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockGetTaskQuestions: vi.fn(),
  mockGetModelByCommentId: vi.fn(),
  mockSetAgentResponse: vi.fn(),
  mockListByTaskId: vi.fn(),
  mockRunAgentInvokeWithTools: vi.fn(),
  mockFinalizeTaskProgress: vi.fn(),
  mockLogger: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: { getModelById: mockGetModelById },
    commands: { markInProgress: mockMarkInProgress, complete: mockComplete, fail: mockFail },
  },
  TaskStatus: {
    InProgress: 'in-progress',
    Paused: 'paused',
    Waiting: 'waiting',
    Done: 'done',
    Failed: 'failed',
  },
}));

vi.mock('@vassembly/domain-task-questions', () => ({
  default: {
    queries: { getTaskQuestions: mockGetTaskQuestions },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: { getPreferenceByUserId: mockGetPreferenceByUserId },
  },
}));

vi.mock('@vassembly/domain-task-comment', () => ({
  default: {
    commands: { setAgentResponse: mockSetAgentResponse },
    queries: { listByTaskId: mockListByTaskId },
  },
}));

vi.mock('./buildConversationMessage', () => ({
  buildConversationMessage: vi.fn().mockResolvedValue('Summarize report'),
}));

vi.mock('@vassembly/domain-task-progress', () => ({
  default: {
    commands: { finalizeTaskProgress: mockFinalizeTaskProgress },
    queries: { getModelByCommentId: mockGetModelByCommentId },
  },
}));

vi.mock('@vassembly/service-agent', () => ({
  runAgentInvokeWithTools: mockRunAgentInvokeWithTools,
}));

vi.mock('@vassembly/logger', () => ({
  logger: mockLogger,
}));

import { executeTask } from './index';

const BASE_TASK = {
  id: 'task-1',
  userId: 'user-1',
  description: 'Summarize report',
  status: 'in-progress',
  agentAssignedId: 'agent-1',
};

describe('executeTask handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({ data: BASE_TASK });
    mockMarkInProgress.mockResolvedValue({ data: BASE_TASK });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: { integrationCredentialId: 'cred-1' },
    });
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: 'LLM result',
      metadata: {
        provider: 'openai',
        model: 'gpt-4',
        mcpIdsUsed: [],
        skippedMcpIds: [],
        internalToolIdsUsed: ['agent-list'],
        skippedInternalToolIds: [],
        maxUseAgentDepth: 2,
      },
    });
    mockComplete.mockResolvedValue({ data: {} });
    mockFail.mockResolvedValue({ data: {} });
    mockFinalizeTaskProgress.mockResolvedValue({ completedAt: new Date() });
    mockGetTaskQuestions.mockResolvedValue({ data: { answeredQuestions: [] } });
    mockGetModelByCommentId.mockResolvedValue({ data: { events: [] } });
    mockSetAgentResponse.mockResolvedValue({ data: {} });
    mockListByTaskId.mockResolvedValue({ data: [] });
  });

  const EXECUTE_PARAMS = { taskId: 'task-1', userId: 'user-1', commentId: 'comment-1' };

  it('should complete task when credential exists and LLM invoke succeeds', async () => {
    await executeTask(EXECUTE_PARAMS);

    expect(mockGetModelById).toHaveBeenCalledTimes(1);
    expect(mockRunAgentInvokeWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        agentType: 'system',
        agentId: 'agent-1',
        message: 'Summarize report',
        connectionOverride: { integrationCredentialId: 'cred-1' },
        toolContext: expect.objectContaining({
          userId: 'user-1',
          taskId: 'task-1',
          commentId: 'comment-1',
          invocationId: expect.any(String),
          callerAgentId: 'agent-1',
          callerAgentType: 'system',
          recursionDepth: 0,
          specializationIds: null,
          recordAgentInvokeProgress: expect.any(Function),
        }),
      }),
    );
    expect(mockFinalizeTaskProgress).toHaveBeenCalledWith({ commentId: 'comment-1' });
    expect(mockSetAgentResponse).toHaveBeenCalledWith({
      commentId: 'comment-1',
      agentResponse: 'LLM result',
    });
    expect(mockComplete).toHaveBeenCalledWith({
      taskId: 'task-1',
    });
    expect(mockFail).not.toHaveBeenCalled();
    expect(mockLogger).toHaveBeenCalledWith(
      'task.status.done',
      expect.objectContaining({
        meta: expect.objectContaining({ taskId: 'task-1', userId: 'user-1' }),
      }),
    );
  });

  it('should pass specializationIds from task in tool context', async () => {
    mockGetModelById.mockResolvedValue({
      data: { ...BASE_TASK, specializationIds: ['spec-1', 'spec-2'] },
    });

    await executeTask(EXECUTE_PARAMS);

    expect(mockRunAgentInvokeWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        toolContext: expect.objectContaining({
          specializationIds: ['spec-1', 'spec-2'],
        }),
      }),
    );
  });

  it('should fail task when user has no system-call credential preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    await executeTask(EXECUTE_PARAMS);

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'MISSING_CREDENTIAL' }),
    );
    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
  });

  it('should fail task with INVALID_CREDENTIAL when runAgentInvokeWithTools throws ValidationError', async () => {
    mockRunAgentInvokeWithTools.mockRejectedValue(
      new ValidationError("Your system agent connection isn't working.", {
        code: 'SYSTEM_AGENT_CONNECTION_INVALID',
      }),
    );

    await executeTask(EXECUTE_PARAMS);

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'INVALID_CREDENTIAL' }),
    );
  });

  it('should fail task with AGENT_UNAVAILABLE when invoke throws NotFoundError', async () => {
    mockRunAgentInvokeWithTools.mockRejectedValue(new NotFoundError('System agent not found'));

    await executeTask(EXECUTE_PARAMS);

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'AGENT_UNAVAILABLE' }),
    );
  });

  it('should fail task with PROVIDER_TIMEOUT when invoke throws TimeoutError', async () => {
    mockRunAgentInvokeWithTools.mockRejectedValue(new TimeoutError('timed out'));

    await executeTask(EXECUTE_PARAMS);

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'PROVIDER_TIMEOUT' }),
    );
  });

  it('should log waiting transition when invoke throws UserInputWaitingError', async () => {
    mockRunAgentInvokeWithTools.mockRejectedValue(new UserInputWaitingError());

    await executeTask(EXECUTE_PARAMS);

    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockFail).not.toHaveBeenCalled();
    expect(mockLogger).toHaveBeenCalledWith(
      'task.execution.waiting',
      expect.objectContaining({
        meta: expect.objectContaining({ taskId: 'task-1', userId: 'user-1' }),
      }),
    );
  });

  it('should not fail task when task is waiting after a generic execution error', async () => {
    mockRunAgentInvokeWithTools.mockRejectedValue(new Error('wrapped execution error'));
    mockGetModelById
      .mockResolvedValueOnce({ data: BASE_TASK })
      .mockResolvedValue({ data: { ...BASE_TASK, status: 'waiting' } });

    await executeTask(EXECUTE_PARAMS);

    expect(mockFail).not.toHaveBeenCalled();
  });

  it('should fail task with INVALID_AGENT_ASSIGNED when task has no agentAssignedId', async () => {
    mockGetModelById.mockResolvedValue({
      data: { ...BASE_TASK, agentAssignedId: null },
    });

    await executeTask(EXECUTE_PARAMS);

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'INVALID_AGENT_ASSIGNED' }),
    );
    expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
  });
});
