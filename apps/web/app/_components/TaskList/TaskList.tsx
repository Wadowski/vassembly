'use client';

import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

import { Button } from '@vassembly/ui-system-design/button';
import { TextField } from '@vassembly/ui-system-design/text-field';

import {
  TASK_LOADING_MORE_LABEL,
  TASK_LOAD_MORE_LABEL,
  TASK_SEARCH_PLACEHOLDER,
} from './constants';
import styles from './TaskList.module.scss';
import { TaskListItem } from './TaskListItem';
import { TaskListSkeleton } from './TaskListSkeleton';
import type { TaskListProps } from './types';

export const TaskList = ({
  tasks,
  isLoading,
  isLoadingMore,
  hasMore,
  searchValue,
  onSearchChange,
  onLoadMore,
  onTaskClick,
}: TaskListProps): JSX.Element | null => {
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      onSearchChange(event.target.value);
    },
    [onSearchChange],
  );

  const handleLoadMoreClick = useCallback((): void => {
    onLoadMore();
  }, [onLoadMore]);

  if (!isLoading && tasks.length === 0 && searchValue === '') {
    return null;
  }

  if (isLoading && tasks.length === 0) {
    return <TaskListSkeleton />;
  }

  const loadMoreLabel = isLoadingMore ? TASK_LOADING_MORE_LABEL : TASK_LOAD_MORE_LABEL;

  return (
    <section className={styles.list}>
      <div className={styles.items}>
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} onClick={onTaskClick} />
        ))}
      </div>
      <div className={styles.searchRow}>
        <TextField
          isFullWidth
          placeholder={TASK_SEARCH_PLACEHOLDER}
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>
      {hasMore && (
        <div className={styles.loadMoreRow}>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            text={loadMoreLabel}
            onClick={handleLoadMoreClick}
            isDisabled={isLoadingMore}
            isLoading={isLoadingMore}
          />
        </div>
      )}
    </section>
  );
};
