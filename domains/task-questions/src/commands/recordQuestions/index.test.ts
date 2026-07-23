import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const { mockRecordQuestions } = vi.hoisted(() => ({
  mockRecordQuestions: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskQuestionsMongodbDao: {
    recordQuestions: mockRecordQuestions,
  },
}));

import { recordQuestions } from './index';

describe('recordQuestions command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should record pending questions and blocked invocation', async () => {
    mockRecordQuestions.mockResolvedValue({
      taskId: 'task-1',
      pendingQuestions: [{ questionId: 'q-1', question: 'What format?' }],
    });

    const result = await recordQuestions({
      taskId: 'task-1',
      commentId: 'comment-1',
      invocationId: 'inv-1',
      askedByAgentId: 'agent-1',
      askedByAgentType: 'system',
      questions: [{ question: 'What format?', inputType: 'text' }],
    });

    expect(result.data?.taskId).toBe('task-1');
    expect(mockRecordQuestions).toHaveBeenCalledOnce();
  });

  it('should throw ValidationError when questions array is empty', async () => {
    await expect(
      recordQuestions({
        taskId: 'task-1',
        commentId: 'comment-1',
        invocationId: 'inv-1',
        askedByAgentId: 'agent-1',
        askedByAgentType: 'system',
        questions: [],
      }),
    ).rejects.toThrow(ValidationError);
  });
});
