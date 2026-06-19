import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

const {
  mockGetModelById,
  mockSubmitAnswer,
  mockMarkInProgressFromWaiting,
  mockClearBlockedInvocations,
  mockGetTaskQuestions,
  mockResumeInvocation,
  mockExecuteTask,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockSubmitAnswer: vi.fn(),
  mockMarkInProgressFromWaiting: vi.fn(),
  mockClearBlockedInvocations: vi.fn(),
  mockGetTaskQuestions: vi.fn(),
  mockResumeInvocation: vi.fn(),
  mockExecuteTask: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: {
      getModelById: mockGetModelById,
    },
    commands: {
      markInProgressFromWaiting: mockMarkInProgressFromWaiting,
    },
  },
}));

vi.mock('@vassembly/domain-task-questions', () => ({
  default: {
    commands: {
      submitAnswer: mockSubmitAnswer,
      clearBlockedInvocations: mockClearBlockedInvocations,
    },
    queries: {
      getTaskQuestions: mockGetTaskQuestions,
    },
  },
  toTaskQuestionsResponse: ({ taskQuestions }: { taskQuestions: { taskId: string } }) => ({
    taskId: taskQuestions.taskId,
    pendingQuestions: [],
    answeredQuestions: [],
  }),
}));

vi.mock('@vassembly/service-agent', () => ({
  invocationResumeRegistry: {
    resumeInvocation: mockResumeInvocation,
  },
}));

vi.mock('@vassembly/service-task', () => ({
  default: {
    executeTask: mockExecuteTask,
    TaskExecutionMode: {
      Resume: 'resume',
    },
  },
}));

vi.mock('@vassembly/logger', () => ({
  logger: vi.fn(),
}));

import { submitAnswer } from './index';

describe('submitAnswer handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({
      data: { id: 'task-1', userId: 'user-1' },
    });
    mockMarkInProgressFromWaiting.mockResolvedValue({ data: { id: 'task-1' } });
    mockClearBlockedInvocations.mockResolvedValue({ data: { taskId: 'task-1' } });
    mockGetTaskQuestions.mockResolvedValue({
      data: { taskId: 'task-1', pendingQuestions: [], answeredQuestions: [] },
    });
    mockResumeInvocation.mockResolvedValue(true);
    mockExecuteTask.mockResolvedValue(undefined);
  });

  it('should return updated questions without resuming when pending questions remain', async () => {
    mockSubmitAnswer.mockResolvedValue({
      data: {
        taskId: 'task-1',
        pendingQuestions: [{ questionId: 'q-2' }],
        answeredQuestions: [{ questionId: 'q-1' }],
      },
    });

    const result = await submitAnswer({
      userId: 'user-1',
      taskId: 'task-1',
      questionId: 'q-1',
      answer: 'yes',
    });

    expect(result.taskQuestions.taskId).toBe('task-1');
    expect(mockMarkInProgressFromWaiting).not.toHaveBeenCalled();
    expect(mockResumeInvocation).not.toHaveBeenCalled();
    expect(mockExecuteTask).not.toHaveBeenCalled();
  });

  it('should resume blocked child invocations and skip executeTask when root is not blocked', async () => {
    mockSubmitAnswer.mockResolvedValue({
      data: {
        taskId: 'task-1',
        pendingQuestions: [],
        answeredQuestions: [{ questionId: 'q-1', answer: 'done' }],
        blockedInvocations: [{ invocationId: 'child-1' }],
      },
    });
    mockResumeInvocation.mockResolvedValue(true);

    await submitAnswer({
      userId: 'user-1',
      taskId: 'task-1',
      questionId: 'q-1',
      answer: 'done',
    });

    expect(mockMarkInProgressFromWaiting).toHaveBeenCalledWith({ taskId: 'task-1' });
    expect(mockResumeInvocation).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        invocationId: 'child-1',
      }),
    );
    expect(mockClearBlockedInvocations).toHaveBeenCalledWith({ taskId: 'task-1' });
    expect(mockExecuteTask).not.toHaveBeenCalled();
  });

  it('should fire executeTask resume when root invocation was blocked', async () => {
    mockSubmitAnswer.mockResolvedValue({
      data: {
        taskId: 'task-1',
        pendingQuestions: [],
        answeredQuestions: [{ questionId: 'q-1', answer: 'done' }],
        blockedInvocations: [{ invocationId: 'root-1' }],
      },
    });
    mockResumeInvocation.mockResolvedValue(false);

    await submitAnswer({
      userId: 'user-1',
      taskId: 'task-1',
      questionId: 'q-1',
      answer: 'done',
    });

    expect(mockExecuteTask).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      mode: 'resume',
    });
  });

  it('should throw NotFoundError when user does not own the task', async () => {
    mockGetModelById.mockResolvedValue({
      data: { id: 'task-1', userId: 'other-user' },
    });

    await expect(
      submitAnswer({
        userId: 'user-1',
        taskId: 'task-1',
        questionId: 'q-1',
        answer: 'no',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
