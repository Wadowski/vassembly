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
  createdAt: partial.createdAt ?? '2026-03-12T15:45:00.000Z',
  updatedAt: partial.updatedAt ?? '2026-03-12T16:10:00.000Z',
});

describe('buildSyntheticTimelineEvents', () => {
  it('should return exactly two chronologically ordered events with required shape when task has distinct timestamps', () => {
    const task = buildTask({
      status: TaskStatus.InProgress,
      createdAt: '2026-03-12T15:45:00.000Z',
      updatedAt: '2026-03-12T16:10:00.000Z',
    });

    const events = buildSyntheticTimelineEvents(task);

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.id)).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
    expect(new Set(events.map((event) => event.id)).size).toBe(2);

    events.forEach((event) => {
      expect(event).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
      expect(event.description === undefined || typeof event.description === 'string').toBe(true);
      expect(event.icon === undefined || typeof event.icon === 'function').toBe(true);
    });

    const [firstEvent, secondEvent] = events;
    expect(firstEvent?.title).toBe('Task created');
    expect(firstEvent?.timestamp).toBe(task.createdAt);
    expect(secondEvent?.title).toBe('Status: In progress');
    expect(secondEvent?.timestamp).toBe(task.updatedAt);
    expect(new Date(firstEvent?.timestamp ?? '').getTime()).toBeLessThanOrEqual(
      new Date(secondEvent?.timestamp ?? '').getTime(),
    );
  });

  it('should use createdAt for status event timestamp when task was never updated', () => {
    const createdAt = '2026-03-12T15:45:00.000Z';
    const task = buildTask({
      status: TaskStatus.Done,
      createdAt,
      updatedAt: createdAt,
    });

    const events = buildSyntheticTimelineEvents(task);

    expect(events).toHaveLength(2);
    expect(events[0]?.title).toBe('Task created');
    expect(events[0]?.timestamp).toBe(createdAt);
    expect(events[1]?.title).toBe('Status: Done');
    expect(events[1]?.timestamp).toBe(createdAt);
  });

  it('should map status labels for created failed and unknown statuses', () => {
    const createdTask = buildTask({
      status: TaskStatus.Created,
      createdAt: '2026-03-12T15:45:00.000Z',
      updatedAt: '2026-03-12T15:45:00.000Z',
    });
    const failedTask = buildTask({
      id: 'task-failed',
      status: TaskStatus.Failed,
      createdAt: '2026-03-12T15:45:00.000Z',
      updatedAt: '2026-03-12T16:00:00.000Z',
    });
    const unknownTask = buildTask({
      id: 'task-unknown',
      status: 'unexpected-status' as TaskDto['status'],
      createdAt: '2026-03-12T15:45:00.000Z',
      updatedAt: '2026-03-12T16:00:00.000Z',
    });

    expect(buildSyntheticTimelineEvents(createdTask)[1]?.title).toBe('Status: Created');
    expect(buildSyntheticTimelineEvents(failedTask)[1]?.title).toBe('Status: Failed');
    expect(buildSyntheticTimelineEvents(unknownTask)[1]?.title).toBe('Status: Unknown');
  });

  it('should include status icon on status event when status is recognized', () => {
    const task = buildTask({ status: TaskStatus.InProgress });

    const events = buildSyntheticTimelineEvents(task);
    const statusEvent = events[1];

    expect(statusEvent?.icon).toEqual(expect.any(Function));
    expect(events[0]?.icon).toBeUndefined();
  });
});
