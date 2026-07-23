import {
  type SubmitTaskCommentResponse,
} from '@vassembly/ui-api-hooks';

import styles from './TaskActivityFeed.module.scss';

import { TaskActivityFilter } from '../TaskActivityFilter/TaskActivityFilter';
import { TaskActivityFeedItem } from './TaskActivityFeedItem';
import { useTaskActivityFeed } from './useTaskActivityFeed';

export interface TaskActivityFeedProps {
  taskId: string;
  taskStatus: string;
  activeCommentId: string | null;
  pendingUserComment: SubmitTaskCommentResponse['comment'] | null;
  onPendingUserCommentSynced: () => void;
  onTaskUpdated: () => void;
}

export const TaskActivityFeed = ({
  taskId,
  taskStatus,
  activeCommentId,
  pendingUserComment,
  onPendingUserCommentSynced,
  onTaskUpdated,
}: TaskActivityFeedProps): JSX.Element => {
  const { items, selectedGroups, setSelectedGroups, isEmpty } = useTaskActivityFeed({
    taskId,
    taskStatus,
    activeCommentId,
    pendingUserComment,
    onPendingUserCommentSynced,
    onTaskUpdated,
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
      {isEmpty ? (
        <p className={styles.empty} data-testid="task-activity-feed-empty">
          No activity yet.
        </p>
      ) : (
        <ul className={styles.list} role="list" aria-live="polite">
          {items.map((item) => (
            <TaskActivityFeedItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
};
