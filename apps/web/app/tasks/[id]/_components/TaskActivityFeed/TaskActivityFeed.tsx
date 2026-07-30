'use client';

import { useMemo } from 'react';

import {
  type SubmitTaskCommentResponse,
  TaskStatus,
} from '@vassembly/ui-api-hooks';

import styles from './TaskActivityFeed.module.scss';

import { TaskActivityFilter } from '../TaskActivityFilter/TaskActivityFilter';
import { TaskActivityFeedItem } from './TaskActivityFeedItem';
import {
  getItemIdsKey,
  useTaskActivityListAnimation,
} from './hooks/useTaskActivityListAnimation';
import { TaskActivityThinkingIndicator } from './taskActivityThinkingIndicator';
import { useTaskActivityFeed } from './useTaskActivityFeed';

export interface TaskActivityFeedProps {
  taskId: string;
  taskStatus: string;
  activeCommentId: string | null;
  pendingUserComment: SubmitTaskCommentResponse['comment'] | null;
  onPendingUserCommentSynced: () => void;
  onTaskUpdated: () => void;
  isAdmin: boolean;
}

export const TaskActivityFeed = ({
  taskId,
  taskStatus,
  activeCommentId,
  pendingUserComment,
  onPendingUserCommentSynced,
  onTaskUpdated,
  isAdmin,
}: TaskActivityFeedProps): JSX.Element => {
  const { items, selectedGroups, setSelectedGroups, isEmpty } = useTaskActivityFeed({
    taskId,
    taskStatus,
    activeCommentId,
    pendingUserComment,
    onPendingUserCommentSynced,
    onTaskUpdated,
  });

  const isTaskInProgress = taskStatus === TaskStatus.InProgress;
  const itemIdsKey = useMemo(
    () => getItemIdsKey({ itemIds: items.map((item) => item.id) }),
    [items],
  );
  const { listRef } = useTaskActivityListAnimation({
    itemIdsKey,
    enteringClassName: styles.listItemEntering ?? '',
  });

  return (
    <section
      className={styles.feed}
      data-testid="task-activity-feed"
      aria-labelledby="task-activity-feed-heading"
    >
      <h2 id="task-activity-feed-heading" className={styles.heading}>
        Activity
      </h2>
      <TaskActivityFilter selectedGroups={selectedGroups} onChange={setSelectedGroups} />
      {isTaskInProgress ? <TaskActivityThinkingIndicator /> : null}
      {isEmpty ? (
        <p className={styles.empty} data-testid="task-activity-feed-empty">
          No activity yet.
        </p>
      ) : (
        <ul ref={listRef} className={styles.list} role="list" aria-live="polite">
          {items.map((item) => (
            <li
              key={item.id}
              className={styles.listItem}
              data-activity-item-id={item.id}
            >
              <div className={styles.listItemContent} data-activity-item-enter>
                <TaskActivityFeedItem item={item} isAdmin={isAdmin} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
