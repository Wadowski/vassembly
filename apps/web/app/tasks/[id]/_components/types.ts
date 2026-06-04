import type { TaskDto } from '@vassembly/ui-api-hooks';

import type { SyntheticTimelineEvent } from '../lib/types';

export interface TaskStatusBadgeProps {
  status: TaskDto['status'];
}

export interface TaskDetailHeaderProps {
  task: TaskDto;
}

export interface TaskDetailDescriptionProps {
  description: string;
}

export interface TaskDetailErrorProps {
  variant: 'notFound' | 'error';
  message?: string;
  onRetry?: () => void;
}

export interface TaskDetailTimelineProps {
  task: TaskDto;
}

export interface UseTaskDetailTimelineParams {
  task: TaskDto;
}

export interface UseTaskDetailTimelineResult {
  events: SyntheticTimelineEvent[];
}

export interface TaskDetailTimelineEventRowProps {
  event: SyntheticTimelineEvent;
}
