import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

const TASK_QUESTIONS_RESPONSE = {
  taskId: 'task-1',
  pendingQuestions: [
    {
      questionId: 'q-1',
      invocationId: 'inv-1',
      askedByAgentId: 'agent-1',
      askedByAgentType: 'system',
      question: 'Which option?',
      inputType: 'select',
      options: ['A', 'B'],
      askedAt: '2026-06-17T10:00:00.000Z',
    },
  ],
  answeredQuestions: [],
};

const AUTH_HEADERS = {
  authorization: 'Bearer valid-token',
};

const { mockAuthorize, mockGetTaskQuestions } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockGetTaskQuestions: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-task-questions', () => ({
  default: {
    getTaskQuestions: mockGetTaskQuestions,
  },
}));

import { taskGetQuestionsRoute } from './getTaskQuestions';

describe('GET /tasks/:id/questions route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockGetTaskQuestions.mockResolvedValue({ taskQuestions: TASK_QUESTIONS_RESPONSE });
  });

  it('should return task questions when caller is authenticated and owns the task', async () => {
    const result = await taskGetQuestionsRoute.handler({
      body: undefined,
      query: {},
      headers: AUTH_HEADERS,
      params: { id: 'task-1' },
    });

    expect(result).toEqual(TASK_QUESTIONS_RESPONSE);
    expect(mockGetTaskQuestions).toHaveBeenCalledWith({ userId: 'user-1', taskId: 'task-1' });
  });

  it('should throw UnauthorizedError when auth token is missing', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      taskGetQuestionsRoute.handler({
        body: undefined,
        query: {},
        headers: {},
        params: { id: 'task-1' },
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should propagate NotFoundError from service when task is not owned', async () => {
    mockGetTaskQuestions.mockRejectedValue(new NotFoundError('Task not found'));

    await expect(
      taskGetQuestionsRoute.handler({
        body: undefined,
        query: {},
        headers: AUTH_HEADERS,
        params: { id: 'task-1' },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
