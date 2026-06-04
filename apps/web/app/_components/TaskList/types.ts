import type { ComponentType } from 'react';

import type { TaskDto } from '@vassembly/ui-api-hooks';

export type TaskListItemDto = TaskDto;

export interface TaskListProps {
  tasks: TaskListItemDto[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
  onTaskClick?: (taskId: string) => void;
}

export interface TaskListItemProps {
  task: TaskListItemDto;
  onClick?: (id: string) => void;
}

export type TaskStatusValue = TaskListItemDto['status'] | string;

export type ColorValue = 'secondary' | 'info' | 'success' | 'error';

export type IconComponent = ComponentType<{ className?: string }>;
