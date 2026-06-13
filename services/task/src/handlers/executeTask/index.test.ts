import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, TimeoutError, ValidationError } from '@vassembly/errors';

const {
  mockGetModelById,
  mockMarkInProgress,
  mockComplete,
  mockFail,
  mockGetPreferenceByUserId,
  mockResolveAndBuildClient,
  mockInvoke,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockMarkInProgress: vi.fn(),
  mockComplete: vi.fn(),
  mockFail: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockResolveAndBuildClient: vi.fn(),
  mockInvoke: vi.fn(),
  mockLogger: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: { getModelById: mockGetModelById },
    commands: { markInProgress: mockMarkInProgress, complete: mockComplete, fail: mockFail },
  },
  TaskStatus: {
    InProgress: 'in-progress',
    Done: 'done',
    Failed: 'failed',
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: { getPreferenceByUserId: mockGetPreferenceByUserId },
    commands: { invoke: mockInvoke },
  },
}));

vi.mock('@vassembly/domain-ai-integration', () => ({
  default: {
    commands: { resolveAndBuildClient: mockResolveAndBuildClient },
  },
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
    mockResolveAndBuildClient.mockResolvedValue({ invoke: vi.fn() });
    mockInvoke.mockResolvedValue({
      message: 'LLM result',
      metadata: { provider: 'openai', model: 'gpt-4' },
    });
    mockComplete.mockResolvedValue({ data: {} });
    mockFail.mockResolvedValue({ data: {} });
  });

  it('should complete task when credential exists and LLM invoke succeeds', async () => {
    await executeTask({ taskId: 'task-1', userId: 'user-1' });

    expect(mockComplete).toHaveBeenCalledWith({
      taskId: 'task-1',
      llmResponse: 'LLM result',
    });
    expect(mockFail).not.toHaveBeenCalled();
    expect(mockLogger).toHaveBeenCalledWith(
      'task.status.done',
      expect.objectContaining({
        meta: expect.objectContaining({ taskId: 'task-1', userId: 'user-1' }),
      }),
    );
  });

  it('should fail task when user has no system-call credential preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    await executeTask({ taskId: 'task-1', userId: 'user-1' });

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'MISSING_CREDENTIAL' }),
    );
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('should fail task with INVALID_CREDENTIAL when resolveAndBuildClient throws ValidationError', async () => {
    mockResolveAndBuildClient.mockRejectedValue(
      new ValidationError("Your system agent connection isn't working.", {
        code: 'SYSTEM_AGENT_CONNECTION_INVALID',
      }),
    );

    await executeTask({ taskId: 'task-1', userId: 'user-1' });

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'INVALID_CREDENTIAL' }),
    );
  });

  it('should fail task with AGENT_UNAVAILABLE when invoke throws NotFoundError', async () => {
    mockInvoke.mockRejectedValue(new NotFoundError('System agent not found'));

    await executeTask({ taskId: 'task-1', userId: 'user-1' });

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'AGENT_UNAVAILABLE' }),
    );
  });

  it('should fail task with PROVIDER_TIMEOUT when invoke throws TimeoutError', async () => {
    mockInvoke.mockRejectedValue(new TimeoutError('timed out'));

    await executeTask({ taskId: 'task-1', userId: 'user-1' });

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'PROVIDER_TIMEOUT' }),
    );
  });

  it('should fail task with INVALID_AGENT_ASSIGNED when task has no agentAssignedId', async () => {
    mockGetModelById.mockResolvedValue({
      data: { ...BASE_TASK, agentAssignedId: null },
    });

    await executeTask({ taskId: 'task-1', userId: 'user-1' });

    expect(mockFail).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'INVALID_AGENT_ASSIGNED' }),
    );
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
