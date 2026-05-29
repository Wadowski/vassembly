import { render, screen, waitFor, within } from '@testing-library/react';
import { lazy, Suspense } from 'react';
import { describe, expect, it } from 'vitest';

import { TaskStatus, TaskType, type TaskDto } from '@vassembly/ui-api-hooks';

import { TaskDetailTimelineSkeleton } from './TaskDetailTimeline';

const LazyTaskDetailTimeline = lazy(async () => {
  const module = await import('./TaskDetailTimeline');
  return { default: module.TaskDetailTimeline };
});

const buildTask = (partial: Partial<TaskDto> = {}): TaskDto => ({
  id: partial.id ?? 'task-1',
  userId: partial.userId ?? 'user-1',
  description: partial.description ?? 'Review quarterly report',
  type: partial.type ?? TaskType.User,
  status: partial.status ?? TaskStatus.InProgress,
  agentAssignedId: partial.agentAssignedId ?? null,
  title: partial.title ?? 'Quarterly review',
  createdAt: partial.createdAt ?? '2026-03-12T15:45:00.000Z',
  updatedAt: partial.updatedAt ?? '2026-03-12T16:10:00.000Z',
});

const formatDateTime = (value: string): string => new Date(value).toLocaleString();

const renderLazyTimeline = (task: TaskDto): void => {
  render(
    <Suspense fallback={<TaskDetailTimelineSkeleton />}>
      <LazyTaskDetailTimeline task={task} />
    </Suspense>,
  );
};

describe('TaskDetailTimeline', () => {
  it('should show timeline skeleton fallback and no events before lazy component resolves', () => {
    renderLazyTimeline(buildTask());

    expect(screen.getByTestId('task-detail-timeline-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('task-detail-timeline')).not.toBeInTheDocument();
    expect(screen.queryByText('Task created')).not.toBeInTheDocument();
    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument();
  });

  it('should render Activity heading with event titles and timestamps after lazy load', async () => {
    const task = buildTask({
      status: TaskStatus.InProgress,
      createdAt: '2026-03-12T15:45:00.000Z',
      updatedAt: '2026-03-12T16:10:00.000Z',
    });

    renderLazyTimeline(task);

    const timeline = await screen.findByTestId('task-detail-timeline');
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(within(timeline).getByText('Task created')).toBeInTheDocument();
    expect(within(timeline).getByText('Status: In progress')).toBeInTheDocument();
    expect(within(timeline).getByText(formatDateTime(task.createdAt))).toBeInTheDocument();
    expect(within(timeline).getByText(formatDateTime(task.updatedAt))).toBeInTheDocument();
  });

  it('should render events in a vertical timeline list layout', async () => {
    const task = buildTask({
      status: TaskStatus.Done,
      createdAt: '2026-03-12T15:45:00.000Z',
      updatedAt: '2026-03-12T16:10:00.000Z',
    });

    renderLazyTimeline(task);

    const timeline = await screen.findByTestId('task-detail-timeline');
    const eventList = within(timeline).getByRole('list', { name: 'Activity timeline' });
    const events = within(eventList).getAllByRole('listitem');

    expect(events).toHaveLength(2);
    expect(events[0]).toHaveTextContent('Task created');
    expect(events[1]).toHaveTextContent('Status: Done');
    expect(timeline).toHaveAttribute('data-layout', 'vertical');
  });

  it('should use createdAt timestamp for status row when task was never updated', async () => {
    const createdAt = '2026-03-12T15:45:00.000Z';
    const task = buildTask({
      status: TaskStatus.Created,
      createdAt,
      updatedAt: createdAt,
    });

    renderLazyTimeline(task);

    const timeline = await screen.findByTestId('task-detail-timeline');
    const formattedCreatedAt = formatDateTime(createdAt);
    const timestamps = within(timeline).getAllByText(formattedCreatedAt);

    expect(timestamps).toHaveLength(2);
    await waitFor(() => {
      expect(screen.queryByTestId('task-detail-timeline-skeleton')).not.toBeInTheDocument();
    });
  });
});
