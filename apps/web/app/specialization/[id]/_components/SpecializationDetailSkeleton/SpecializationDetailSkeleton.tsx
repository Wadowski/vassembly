'use client';

import { Skeleton } from '@vassembly/ui-skeleton';

import styles from './SpecializationDetailSkeleton.module.scss';

export const SpecializationDetailSkeleton = (): JSX.Element => {
  return (
    <main className={styles.page}>
      <Skeleton width="240px" height="32px" />
      <Skeleton width="100%" height="120px" />
      <div className={styles.panels}>
        <Skeleton width="100%" height="280px" />
        <Skeleton width="100%" height="280px" />
      </div>
    </main>
  );
};
