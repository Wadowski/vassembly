import {
  AlertCircleIcon,
  CheckCircleIcon,
  SingleNeutralCircleIcon,
  TimeClockCircleIcon,
} from '@vassembly/ui-icons';

import { TaskStatus } from '@vassembly/ui-api-hooks';

import type { ColorValue, IconComponent, TaskStatusValue } from './types';

const STATUS_ICON_MAP: Record<string, IconComponent> = {
  [TaskStatus.Created]: TimeClockCircleIcon,
  [TaskStatus.InProgress]: SingleNeutralCircleIcon,
  [TaskStatus.Done]: CheckCircleIcon,
  [TaskStatus.Failed]: AlertCircleIcon,
};

const STATUS_COLOR_MAP: Record<string, ColorValue> = {
  [TaskStatus.Created]: 'secondary',
  [TaskStatus.InProgress]: 'info',
  [TaskStatus.Done]: 'success',
  [TaskStatus.Failed]: 'error',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  [TaskStatus.Created]: 'Created',
  [TaskStatus.InProgress]: 'In progress',
  [TaskStatus.Done]: 'Done',
  [TaskStatus.Failed]: 'Failed',
};

export const getStatusIcon = (status: TaskStatusValue): IconComponent =>
  STATUS_ICON_MAP[status] ?? TimeClockCircleIcon;

export const getStatusColor = (status: TaskStatusValue): ColorValue =>
  STATUS_COLOR_MAP[status] ?? 'secondary';

export const getStatusLabel = (status: TaskStatusValue): string =>
  STATUS_LABEL_MAP[status] ?? 'Unknown';
