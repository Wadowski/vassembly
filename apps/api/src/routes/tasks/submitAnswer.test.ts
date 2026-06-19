import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

const TASK_QUESTIONS_RESPONSE = {
  taskId: 'task-1',
  pendingQuestions: [],
  answeredQuestions: [
    {
      questionId: 'q-1',
      invocationId: 'inv-1',
      askedByAgentId: 'agent-1',
      askedByAgentType: 'system',
      question: 'Which option?',
      inputType: 'select',
      options: ['A', 'B'],
      answer: 'A',
      askedAt: '2026-06-17T10:00:00.000Z',
      answeredAt: '2026-06-17T10:01:00.000Z',
    },
  ],
};

const AUTH_HEADERS = {
  authorization: 'Bearer valid-token',
};

const VALID_BODY = {
  answer: 'A',
};

const { mockAuthorize, mockSubmitAnswer } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockSubmitAnswer: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-task-questions', () => ({
  default: {
    submitAnswer: mockSubmitAnswer,
  },
}));

import { taskSubmitAnswerRoute } from './submitAnswer';

describe('PATCH /tasks/:id/questions/:questionId/answer route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockSubmitAnswer.mockResolvedValue({ taskQuestions: TASK_QUESTIONS_RESPONSE });
  });

  it('should return updated task questions when answer is submitted', async () => {
    const result = await taskSubmitAnswerRoute.handler({
      body: VALID_BODY,
      query: {},
      headers: AUTH_HEADERS,
      params: { id: 'task-1', questionId: 'q-1' },
    });

    expect(result).toEqual(TASK_QUESTIONS_RESPONSE);
    expect(mockSubmitAnswer).toHaveBeenCalledWith({
      userId: 'user-1',
      taskId: 'task-1',
      questionId: 'q-1',
      answer: 'A',
    });
  });

  it('should throw UnauthorizedError when auth token is missing', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      taskSubmitAnswerRoute.handler({
        body: VALID_BODY,
        query: {},
        headers: {},
        params: { id: 'task-1', questionId: 'q-1' },
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should propagate NotFoundError from service when task is not owned', async () => {
    mockSubmitAnswer.mockRejectedValue(new NotFoundError('Task not found'));

    await expect(
      taskSubmitAnswerRoute.handler({
        body: VALID_BODY,
        query: {},
        headers: AUTH_HEADERS,
        params: { id: 'task-1', questionId: 'q-1' },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
