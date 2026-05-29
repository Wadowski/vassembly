import type { TaskDto } from '@vassembly/ui-api-hooks';

import { getStatusIcon, getStatusLabel } from '../../../_components/TaskList/taskStatusDisplay';
import type { SyntheticTimelineEvent } from './types';

const CREATED_EVENT_ID = 'created';
const STATUS_EVENT_ID = 'status';

const EVENT_SORT_ORDER_MAP: Record<string, number> = {
  [CREATED_EVENT_ID]: 0,
  [STATUS_EVENT_ID]: 1,
};

const getEventSortOrder = (eventId: string): number => EVENT_SORT_ORDER_MAP[eventId] ?? 2;

export const buildSyntheticTimelineEvents = (task: TaskDto): SyntheticTimelineEvent[] => {
  const createdEvent: SyntheticTimelineEvent = {
    id: CREATED_EVENT_ID,
    title: 'Task created',
    timestamp: task.createdAt,
    author: 'TBD',
  };

  const statusEvent: SyntheticTimelineEvent = {
    id: STATUS_EVENT_ID,
    title: `Status: ${getStatusLabel(task.status)}`,
    timestamp: task.updatedAt || task.createdAt,
    icon: getStatusIcon(task.status),
    author: 'TBD',
  };

  return [createdEvent, statusEvent].sort((firstEvent, secondEvent) => {
    const timeDifference =
      new Date(firstEvent.timestamp).getTime() - new Date(secondEvent.timestamp).getTime();

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return getEventSortOrder(firstEvent.id) - getEventSortOrder(secondEvent.id);
  });
};
