import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, ExecutionPausedError, UserInputWaitingError } from '@vassembly/errors';

const { mockRecordQuestions, mockMarkWaiting } = vi.hoisted(() => ({
  mockRecordQuestions: vi.fn(),
  mockMarkWaiting: vi.fn(),
}));

vi.mock('@vassembly/domain-task-questions', () => ({
  default: {
    commands: {
      recordQuestions: mockRecordQuestions,
    },
  },
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    commands: {
      markWaiting: mockMarkWaiting,
    },
  },
}));

import { askUser } from './index';

import type { InternalToolContext } from '../types';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  commentId: 'comment-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('askUser internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordQuestions.mockResolvedValue({ data: { taskId: 'task-1' } });
    mockMarkWaiting.mockResolvedValue({ data: { id: 'task-1' } });
  });

  it('should record a single question and throw UserInputWaitingError', async () => {
    await expect(
      askUser({
        args: { question: 'What is the priority?' },
        context: BASE_CONTEXT,
      }),
    ).rejects.toThrow(UserInputWaitingError);

    expect(mockRecordQuestions).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
  commentId: 'comment-1',
        invocationId: 'invocation-1',
        askedByAgentId: 'agent-1',
        askedByAgentType: 'system',
        questions: [expect.objectContaining({ question: 'What is the priority?' })],
      }),
    );
    expect(mockMarkWaiting).toHaveBeenCalledWith({ taskId: 'task-1' });
  });

  it('should normalize batch questions before recording', async () => {
    await expect(
      askUser({
        args: {
          questions: [
            { question: 'First question' },
            { question: 'Second question', input_type: 'boolean' },
          ],
        },
        context: BASE_CONTEXT,
      }),
    ).rejects.toThrow(UserInputWaitingError);

    expect(mockRecordQuestions).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [
          expect.objectContaining({ question: 'First question' }),
          expect.objectContaining({ question: 'Second question', inputType: 'boolean' }),
        ],
      }),
    );
  });

  it('should throw ExecutionPausedError when markWaiting hits a conflict', async () => {
    mockMarkWaiting.mockRejectedValue(new ConflictError('Task is not in-progress'));

    await expect(
      askUser({
        args: { question: 'Need input' },
        context: BASE_CONTEXT,
      }),
    ).rejects.toThrow(ExecutionPausedError);
  });
});
