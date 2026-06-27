'use client';

import { Skeleton } from '@vassembly/ui-skeleton';

import styles from './SkillDetailSkeleton.module.scss';

export const SkillDetailSkeleton = (): JSX.Element => {
  return (
    <main className={styles.page} data-testid="skill-detail-skeleton">
      <Skeleton width="180px" height="20px" />
      <Skeleton width="320px" height="36px" />
      <Skeleton width="100%" height="80px" />
      <Skeleton width="100%" height="200px" />
      <Skeleton width="100%" height="360px" />
    </main>
  );
};
