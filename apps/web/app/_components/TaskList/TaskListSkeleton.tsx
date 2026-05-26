'use client';

import { Skeleton } from '@vassembly/ui-skeleton';

import { TASK_LIST_SKELETON_COUNT } from './constants';
import styles from './TaskList.module.scss';

export const TaskListSkeleton = (): JSX.Element => (
  <div className={styles.skeleton} data-testid="task-list-skeleton">
    {Array.from({ length: TASK_LIST_SKELETON_COUNT }).map((_, index) => (
      <div className={styles.skeletonRow} key={index}>
        <Skeleton width="100%" height="16px" />
        <Skeleton width="60%" height="14px" />
        <Skeleton width="80px" height="24px" />
      </div>
    ))}
  </div>
);
