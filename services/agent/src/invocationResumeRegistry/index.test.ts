import { describe, it, expect } from 'vitest';

import { invocationResumeRegistry } from './index';

describe('invocationResumeRegistry', () => {
  it('should resolve waitForCompletion when resumeInvocation runs the worker', async () => {
    const completionPromise = invocationResumeRegistry.waitForCompletion({
      taskId: 'task-1',
      invocationId: 'child-1',
      resume: async ({ answeredQuestions }) =>
        `Resumed with ${answeredQuestions.length} answer(s)`,
    });

    expect(invocationResumeRegistry.hasPending({ taskId: 'task-1', invocationId: 'child-1' })).toBe(
      true,
    );

    const resumed = await invocationResumeRegistry.resumeInvocation({
      taskId: 'task-1',
      invocationId: 'child-1',
      answeredQuestions: [
        {
          questionId: 'q-1',
          commentId: 'comment-1',
          invocationId: 'child-1',
          askedByAgentId: 'agent-1',
          askedByAgentType: 'system',
          question: 'Priority?',
          inputType: 'text',
          askedAt: new Date(),
          answer: 'High',
          answeredAt: new Date(),
        },
      ],
    });

    expect(resumed).toBe(true);
    await expect(completionPromise).resolves.toBe('Resumed with 1 answer(s)');
    expect(invocationResumeRegistry.hasPending({ taskId: 'task-1', invocationId: 'child-1' })).toBe(
      false,
    );
  });

  it('should return false when resuming an invocation without a pending promise', async () => {
    const resumed = await invocationResumeRegistry.resumeInvocation({
      taskId: 'task-1',
      invocationId: 'missing-child',
      answeredQuestions: [],
    });

    expect(resumed).toBe(false);
  });
});
