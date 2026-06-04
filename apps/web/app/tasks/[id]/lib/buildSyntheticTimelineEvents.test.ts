import { describe, expect, it } from 'vitest';

import { TaskStatus, TaskType, type TaskDto } from '@vassembly/ui-api-hooks';

import { buildSyntheticTimelineEvents } from './buildSyntheticTimelineEvents';

const buildTask = (partial: Partial<TaskDto> = {}): TaskDto => ({
  id: partial.id ?? 'task-1',
  userId: partial.userId ?? 'user-1',
  description: partial.description ?? 'Review quarterly report',
  type: partial.type ?? TaskType.User,
  status: partial.status ?? TaskStatus.Created,
  agentAssignedId: partial.agentAssignedId ?? null,
  title: partial.title ?? null,
  llmResponse: partial.llmResponse ?? null,
  errorMessage: partial.errorMessage ?? null,
  errorCode: partial.errorCode ?? null,
  startedAt: partial.startedAt ?? null,
  completedAt: partial.completedAt ?? null,
  failedAt: partial.failedAt ?? null,
  createdAt: partial.createdAt ?? '2026-03-12T15:45:00.000Z',
  updatedAt: partial.updatedAt ?? '2026-03-12T16:10:00.000Z',
});

describe('buildSyntheticTimelineEvents', () => {
  it('should include created started and status events when task is in-progress', () => {
    const task = buildTask({
      status: TaskStatus.InProgress,
      startedAt: '2026-03-12T15:46:00.000Z',
      createdAt: '2026-03-12T15:45:00.000Z',
      updatedAt: '2026-03-12T16:10:00.000Z',
    });

    const events = buildSyntheticTimelineEvents(task);

    expect(events.map((event) => event.title)).toEqual([
      'Task created',
      'Processing started',
      'Status: In progress',
    ]);
  });

  it('should include completed event with duration when task is done', () => {
    const task = buildTask({
      status: TaskStatus.Done,
      startedAt: '2026-03-12T15:45:00.000Z',
      completedAt: '2026-03-12T15:47:30.000Z',
    });

    const events = buildSyntheticTimelineEvents(task);
    const completedEvent = events.find((event) => event.id === 'completed');

    expect(completedEvent?.title).toBe('Completed (150000ms)');
  });

  it('should include failed event with error code when task failed', () => {
    const task = buildTask({
      status: TaskStatus.Failed,
      startedAt: '2026-03-12T15:45:00.000Z',
      failedAt: '2026-03-12T15:46:00.000Z',
      errorCode: 'MISSING_CREDENTIAL',
    });

    const events = buildSyntheticTimelineEvents(task);
    const failedEvent = events.find((event) => event.id === 'failed');

    expect(failedEvent?.title).toBe('Failed: MISSING_CREDENTIAL');
  });

  it('should use createdAt for status event timestamp when task was never updated', () => {
    const createdAt = '2026-03-12T15:45:00.000Z';
    const task = buildTask({
      status: TaskStatus.Created,
      createdAt,
      updatedAt: createdAt,
    });

    const events = buildSyntheticTimelineEvents(task);
    const statusEvent = events.find((event) => event.id === 'status');

    expect(statusEvent?.timestamp).toBe(createdAt);
    expect(statusEvent?.title).toBe('Status: Created');
  });
});
