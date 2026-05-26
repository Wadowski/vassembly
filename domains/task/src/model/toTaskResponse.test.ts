import { describe, it, expect } from 'vitest';

import { TaskStatus, TaskType, type TaskModel } from './model';
import { toTaskResponse } from './toTaskResponse';
import type { TaskResponse } from './dto';

const buildTask = (
  partial: Partial<TaskModel & { title?: string | null }>,
): TaskModel =>
  ({
    id: partial.id ?? 'task-1',
    userId: partial.userId ?? 'user-1',
    description: partial.description ?? 'Review quarterly report',
    type: partial.type ?? TaskType.User,
    status: partial.status ?? TaskStatus.Created,
    agentAssignedId: partial.agentAssignedId ?? null,
    title: partial.title,
    createdAt: partial.createdAt ?? new Date('2026-05-26T12:00:00.000Z'),
    updatedAt: partial.updatedAt ?? new Date('2026-05-26T12:00:00.000Z'),
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

  it('should map failed task status to failed in TaskResponse', () => {
    const response = toTaskResponse({
      task: buildTask({ status: TaskStatus.Failed }),
    });

    expect(response.status).toBe('failed');
  });
});
