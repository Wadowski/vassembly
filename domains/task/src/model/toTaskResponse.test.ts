import { describe, it, expect } from 'vitest';

import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';

import { TaskStatus, TaskType, type TaskModel } from './model';
import { toTaskResponse } from './toTaskResponse';
import type { TaskResponse } from './dto';

const buildTask = (partial: Partial<TaskModel> = {}): TaskModel =>
  ({
    id: 'task-1',
    userId: 'user-1',
    description: 'Review quarterly report',
    type: TaskType.User,
    status: TaskStatus.Created,
    agentAssignedId: null,
    title: null,
    category: null,
    createdAt: new Date('2026-05-26T12:00:00.000Z'),
    updatedAt: new Date('2026-05-26T12:00:00.000Z'),
    ...partial,
  }) as TaskModel;

describe('toTaskResponse', () => {
  it('should include optional nullable title on TaskResponse', () => {
    const response: TaskResponse = toTaskResponse({
      task: buildTask({ title: 'Summarized work' }),
    });

    expect(response.title).toBe('Summarized work');
  });

  it('should map title null to null in TaskResponse', () => {
    const response = toTaskResponse({
      task: buildTask({ title: null }),
    });

    expect(response.title).toBeNull();
  });

  it('should include optional nullable category on TaskResponse', () => {
    const response: TaskResponse = toTaskResponse({
      task: buildTask({ category: INTENT_CATEGORY_SLUG.Task }),
    });

    expect(response.category).toBe(INTENT_CATEGORY_SLUG.Task);
  });

  it('should map category null to null in TaskResponse', () => {
    const response = toTaskResponse({
      task: buildTask({ category: null }),
    });

    expect(response.category).toBeNull();
  });

  it('should map failed task status to failed in TaskResponse', () => {
    const response = toTaskResponse({
      task: buildTask({ status: TaskStatus.Failed }),
    });

    expect(response.status).toBe('failed');
  });

  it('should map execution fields and nullable timestamps on TaskResponse', () => {
    const response = toTaskResponse({
      task: buildTask({
        status: TaskStatus.Done,
        llmResponse: 'AI output',
        startedAt: new Date('2026-06-04T10:00:00.000Z'),
        completedAt: new Date('2026-06-04T10:01:00.000Z'),
      }),
    });

    expect(response.llmResponse).toBe('AI output');
    expect(response.startedAt).toBe('2026-06-04T10:00:00.000Z');
    expect(response.completedAt).toBe('2026-06-04T10:01:00.000Z');
    expect(response.errorMessage).toBeNull();
    expect(response.failedAt).toBeNull();
  });
});
