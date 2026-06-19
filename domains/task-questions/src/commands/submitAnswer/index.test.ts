import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, ValidationError } from '@vassembly/errors';

const { mockFindByTaskId, mockSubmitAnswer } = vi.hoisted(() => ({
  mockFindByTaskId: vi.fn(),
  mockSubmitAnswer: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskQuestionsMongodbDao: {
    findByTaskId: mockFindByTaskId,
    submitAnswer: mockSubmitAnswer,
  },
}));

import { submitAnswer } from './index';

describe('submitAnswer command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should move pending question to answered', async () => {
    mockFindByTaskId.mockResolvedValue({
      taskId: 'task-1',
      pendingQuestions: [
        {
          questionId: 'q-1',
          question: 'What format?',
          invocationId: 'inv-1',
          askedByAgentId: 'agent-1',
          askedByAgentType: 'system',
          inputType: 'text',
          askedAt: new Date(),
        },
      ],
    });
    mockSubmitAnswer.mockResolvedValue({
      taskId: 'task-1',
      pendingQuestions: [],
      answeredQuestions: [{ questionId: 'q-1', answer: 'CSV' }],
    });

    const result = await submitAnswer({
      taskId: 'task-1',
      questionId: 'q-1',
      answer: 'CSV',
    });

    expect(result.data?.answeredQuestions).toHaveLength(1);
    expect(mockSubmitAnswer).toHaveBeenCalledOnce();
  });

  it('should throw ConflictError when question is not pending', async () => {
    mockFindByTaskId.mockResolvedValue({
      taskId: 'task-1',
      pendingQuestions: [],
    });

    await expect(
      submitAnswer({
        taskId: 'task-1',
        questionId: 'q-missing',
        answer: 'CSV',
      }),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ConflictError &&
        (error.error as { code?: string } | undefined)?.code === 'QUESTION_NOT_FOUND'
      );
    });
  });

  it('should throw ValidationError when taskId is empty', async () => {
    await expect(
      submitAnswer({
        taskId: '',
        questionId: 'q-1',
        answer: 'CSV',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
