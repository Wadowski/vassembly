'use client';

import { Skeleton } from '@vassembly/ui-skeleton';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';

export const McpsSkeleton = (): JSX.Element => {
  return (
    <main className={styles.container}>
      <Text variant="h1">
        <Skeleton width="120px" height="32px" />
      </Text>
      <div className={styles.toolbarRow}>
        <Skeleton width="100%" height="40px" />
        <Skeleton width="200px" height="40px" />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className={styles.card}>
            <Skeleton width="60%" height="24px" />
            <Skeleton width="100%" height="48px" />
            <Skeleton width="80%" height="20px" />
          </div>
        ))}
      </div>
    </main>
  );
};
