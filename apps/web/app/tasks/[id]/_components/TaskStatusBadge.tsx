'use client';

import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';

import { getStatusColor, getStatusIcon, getStatusLabel } from '../../../_components/TaskList/taskStatusDisplay';
import { STATUS_COLOR_CLASS_MAP } from '../../../_components/TaskList/taskStatusStyles';
import statusStyles from '../../../_components/TaskList/taskStatusStyles.module.scss';
import type { TaskStatusBadgeProps } from './types';

export const TaskStatusBadge = ({ status }: TaskStatusBadgeProps): JSX.Element => {
  const StatusIcon = getStatusIcon(status);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const statusClassName = STATUS_COLOR_CLASS_MAP[statusColor];

  return (
    <span
      className={resolveClassName(statusStyles.statusBadge, statusClassName)}
      data-testid="task-detail-status"
    >
      <StatusIcon className={statusStyles.statusIcon} aria-hidden />
      <Text variant="body2" className={statusStyles.statusLabel}>
        {statusLabel}
      </Text>
    </span>
  );
};
