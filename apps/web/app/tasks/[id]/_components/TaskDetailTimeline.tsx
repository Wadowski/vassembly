'use client';

import { Skeleton } from '@vassembly/ui-skeleton';
import { Text } from '@vassembly/ui-text';

import pageStyles from '../TaskDetailPage.module.scss';
import { TaskDetailTimelineEventRow } from './TaskDetailTimelineEventRow';
import styles from './TaskDetailTimeline.module.scss';
import type { TaskDetailTimelineProps } from './types';
import { useTaskDetailTimeline } from './useTaskDetailTimeline';

const TIMELINE_SKELETON_ROW_COUNT = 3;

export const TaskDetailTimelineSkeleton = (): JSX.Element => {
  return (
    <section aria-labelledby="task-detail-timeline-skeleton-heading">
      <div className={pageStyles.sectionCard} data-testid="task-detail-timeline-skeleton">
        <Text
          variant="label"
          as="h3"
          id="task-detail-timeline-skeleton-heading"
          className={pageStyles.sectionLabel}
        >
          Activity
        </Text>
        <div className={styles.skeletonRows}>
          {Array.from({ length: TIMELINE_SKELETON_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} height="48px" />
          ))}
        </div>
      </div>
    </section>
  );
};

export const TaskDetailTimeline = ({ task }: TaskDetailTimelineProps): JSX.Element => {
  const { events } = useTaskDetailTimeline({ task });

  return (
    <section aria-labelledby="task-detail-timeline-heading">
      <div
        className={pageStyles.sectionCard}
        data-testid="task-detail-timeline"
        data-layout="vertical"
      >
        <Text
          variant="label"
          as="h3"
          id="task-detail-timeline-heading"
          className={pageStyles.sectionLabel}
        >
          Progress
        </Text>
        <ul className={styles.eventList} aria-label="Activity timeline">
          {events.map((event) => (
            <TaskDetailTimelineEventRow key={event.id} event={event} />
          ))}
        </ul>
      </div>
    </section>
  );
};
