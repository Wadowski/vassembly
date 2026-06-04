'use client';

import { Text } from '@vassembly/ui-text';

import { formatRelativeTime } from '../lib/formatRelativeTime';
import type { TaskDetailTimelineEventRowProps } from './types';
import styles from './TaskDetailTimeline.module.scss';

export const TaskDetailTimelineEventRow = ({
  event,
}: TaskDetailTimelineEventRowProps): JSX.Element => {
  const formattedTimestamp = formatRelativeTime(event.timestamp);

  return (
    <li className={styles.eventRow}>
      <span className={styles.eventNode} aria-hidden />
      <div className={styles.eventContent}>
        <Text variant="body2" className={styles.eventAuthor}>
          @{event.author}
        </Text>
        <Text variant="body2" className={styles.eventTitle}>
          {event.title}
        </Text>
        <Text variant="body2" className={styles.eventTimestamp}>
          {formattedTimestamp}
        </Text>
      </div>
    </li>
  );
};
