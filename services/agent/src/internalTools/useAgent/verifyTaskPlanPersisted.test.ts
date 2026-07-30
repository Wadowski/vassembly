import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetByCommentId = vi.hoisted(() => vi.fn());

vi.mock('@vassembly/domain-task-plan-instance', () => ({
  default: {
    queries: {
      getByCommentId: mockGetByCommentId,
    },
  },
}));

import {
  isTaskPlanPersisted,
  shouldVerifyTaskPlanPersisted,
} from './verifyTaskPlanPersisted';

describe('isTaskPlanPersisted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetByCommentId.mockResolvedValue({ data: null });
  });

  it('should return true when task-plan-persist tool result exists', async () => {
    const result = await isTaskPlanPersisted({
      commentId: 'comment-1',
      internalToolResults: [{ toolId: 'task-plan-persist', content: '{"taskPlanInstanceId":"id-1"}' }],
    });

    expect(result).toBe(true);
    expect(mockGetByCommentId).not.toHaveBeenCalled();
  });

  it('should return true when a plan instance exists for the comment', async () => {
    mockGetByCommentId.mockResolvedValue({ data: { id: 'instance-1' } });

    const result = await isTaskPlanPersisted({
      commentId: 'comment-1',
      internalToolResults: [],
    });

    expect(result).toBe(true);
    expect(mockGetByCommentId).toHaveBeenCalledWith({ commentId: 'comment-1' });
  });

  it('should return false when task-plan-persist tool result contains an error', async () => {
    const result = await isTaskPlanPersisted({
      commentId: 'comment-1',
      internalToolResults: [
        { toolId: 'task-plan-persist', content: '{"error":"Unknown agentName \\"researcher_1\\""}' },
      ],
    });

    expect(result).toBe(false);
    expect(mockGetByCommentId).toHaveBeenCalledWith({ commentId: 'comment-1' });
  });

  it('should return false when persist was not recorded and no instance exists', async () => {
    const result = await isTaskPlanPersisted({
      commentId: 'comment-1',
      internalToolResults: [{ toolId: 'agent-use', content: '{}' }],
    });

    expect(result).toBe(false);
  });
});

describe('shouldVerifyTaskPlanPersisted', () => {
  it('should verify only for Task planner with specializationIds', () => {
    expect(
      shouldVerifyTaskPlanPersisted({
        agentName: 'Task planner',
        specializationIds: ['spec-1'],
      }),
    ).toBe(true);
    expect(
      shouldVerifyTaskPlanPersisted({
        agentName: 'Task planner',
        specializationIds: [],
      }),
    ).toBe(false);
    expect(
      shouldVerifyTaskPlanPersisted({
        agentName: 'Legal worker',
        specializationIds: ['spec-1'],
      }),
    ).toBe(false);
  });
});
