import type { TaskDto } from '@vassembly/ui-api-hooks';

import { getStatusIcon, getStatusLabel } from '../../../_components/TaskList/taskStatusDisplay';
import { formatExecutionDurationMs } from './formatExecutionDurationMs';
import type { SyntheticTimelineEvent } from './types';

const CREATED_EVENT_ID = 'created';
const STARTED_EVENT_ID = 'started';
const STATUS_EVENT_ID = 'status';
const COMPLETED_EVENT_ID = 'completed';
const FAILED_EVENT_ID = 'failed';

const EVENT_SORT_ORDER_MAP: Record<string, number> = {
  [CREATED_EVENT_ID]: 0,
  [STARTED_EVENT_ID]: 1,
  [STATUS_EVENT_ID]: 2,
  [COMPLETED_EVENT_ID]: 3,
  [FAILED_EVENT_ID]: 4,
};

const getEventSortOrder = (eventId: string): number => EVENT_SORT_ORDER_MAP[eventId] ?? 5;

const TIMELINE_AUTHOR_PLACEHOLDER = 'TBD';

export const buildSyntheticTimelineEvents = (task: TaskDto): SyntheticTimelineEvent[] => {
  const events: SyntheticTimelineEvent[] = [
    {
      id: CREATED_EVENT_ID,
      title: 'Task created',
      timestamp: task.createdAt,
      author: TIMELINE_AUTHOR_PLACEHOLDER,
    },
  ];

  if (task.startedAt) {
    events.push({
      id: STARTED_EVENT_ID,
      title: 'Processing started',
      timestamp: task.startedAt,
      author: TIMELINE_AUTHOR_PLACEHOLDER,
    });
  }

  if (task.completedAt) {
    const durationMs = formatExecutionDurationMs({
      startedAt: task.startedAt,
      endedAt: task.completedAt,
    });
    events.push({
      id: COMPLETED_EVENT_ID,
      title: `Completed in ${(durationMs / 1000).toFixed(1)}s`,
      timestamp: task.completedAt,
      author: TIMELINE_AUTHOR_PLACEHOLDER,
    });
  }

  if (task.failedAt) {
    const failedTitle = task.errorCode ? `Failed: ${task.errorCode}` : 'Failed';
    events.push({
      id: FAILED_EVENT_ID,
      title: failedTitle,
      timestamp: task.failedAt,
      author: TIMELINE_AUTHOR_PLACEHOLDER,
    });
  }

  const hasTerminalExecutionEvent = task.completedAt !== null || task.failedAt !== null;

  if (!hasTerminalExecutionEvent) {
    events.push({
      id: STATUS_EVENT_ID,
      title: `Status: ${getStatusLabel(task.status)}`,
      timestamp: task.updatedAt || task.createdAt,
      icon: getStatusIcon(task.status),
      author: TIMELINE_AUTHOR_PLACEHOLDER,
    });
  }

  return events.sort((firstEvent, secondEvent) => {
    const timeDifference =
      new Date(firstEvent.timestamp).getTime() - new Date(secondEvent.timestamp).getTime();

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return getEventSortOrder(firstEvent.id) - getEventSortOrder(secondEvent.id);
  });
};
