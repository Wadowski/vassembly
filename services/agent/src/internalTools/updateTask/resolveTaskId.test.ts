import { describe, expect, it } from 'vitest';

import { resolveTaskId } from './resolveTaskId';

import type { InternalToolContext } from '../types';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: '507f1f77bcf86cd799439011',
  commentId: 'comment-1',
  invocationId: 'inv-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('resolveTaskId', () => {
  it('should prefer context.taskId over args.taskId and args.id during task execution', () => {
    const result = resolveTaskId({
      args: {
        taskId: 'invalid-task-id',
        id: 'also-invalid',
      },
      context: BASE_CONTEXT,
    });

    expect(result).toBe('507f1f77bcf86cd799439011');
  });

  it('should use args.taskId when task execution context is absent', () => {
    const result = resolveTaskId({
      args: { taskId: '507f1f77bcf86cd799439012' },
    });

    expect(result).toBe('507f1f77bcf86cd799439012');
  });

  it('should use explicit taskId param when args and context are absent', () => {
    const result = resolveTaskId({
      args: {},
      taskId: '507f1f77bcf86cd799439013',
    });

    expect(result).toBe('507f1f77bcf86cd799439013');
  });

  it('should fall back to args.id when no other source is available', () => {
    const result = resolveTaskId({
      args: { id: '507f1f77bcf86cd799439014' },
    });

    expect(result).toBe('507f1f77bcf86cd799439014');
  });
});
