'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback } from 'react';

import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';

import { TASK_EMPTY_DESCRIPTION_LABEL } from './constants';
import { getStatusColor, getStatusIcon, getStatusLabel } from './taskStatusDisplay';
import itemStyles from './TaskListItem.module.scss';
import type { TaskListItemProps } from './types';

const STATUS_COLOR_CLASS_MAP = {
  secondary: itemStyles.statusSecondary,
  info: itemStyles.statusInfo,
  success: itemStyles.statusSuccess,
  error: itemStyles.statusError,
} as const;

export const TaskListItem = ({ task, onClick }: TaskListItemProps): JSX.Element => {
  const StatusIcon = getStatusIcon(task.status);
  const statusColor = getStatusColor(task.status);
  const statusLabel = getStatusLabel(task.status);
  const statusClassName = STATUS_COLOR_CLASS_MAP[statusColor];
  const description = task.description.trim() === '' ? TASK_EMPTY_DESCRIPTION_LABEL : task.description;
  const descriptionClassName = resolveClassName(
    itemStyles.description,
    itemStyles.descriptionClamp,
    'descriptionClamp',
  );

  const handleClick = useCallback((): void => {
    if (onClick !== undefined) {
      onClick(task.id);
    }
  }, [onClick, task.id]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (onClick === undefined) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(task.id);
      }
    },
    [onClick, task.id],
  );

  const handleItemClick = useCallback(
    (event: MouseEvent<HTMLDivElement>): void => {
      event.preventDefault();
      handleClick();
    },
    [handleClick],
  );

  return (
    <article
      className={itemStyles.item}
      onClick={handleItemClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
    >
      {task.title && (
        <Text variant="body2" className={itemStyles.summary} data-testid="task-ai-summary">
          {task.title}
        </Text>
      )}
      <Text variant="body1" className={descriptionClassName} data-testid="task-description">
        {description}
      </Text>
      <span className={resolveClassName(itemStyles.statusBadge, statusClassName)}>
        <StatusIcon className={itemStyles.statusIcon} aria-hidden />
        <Text variant="body2" className={itemStyles.statusLabel}>
          {statusLabel}
        </Text>
      </span>
    </article>
  );
};
