'use client';

import { Skeleton } from '@vassembly/ui-system-design/skeleton';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './styles.module.scss';

const SKELETON_CARD_COUNT = 6;

export const SpecializationsSkeleton = (): JSX.Element => {
  return (
    <main className={styles.container}>
      <Text variant="h1">
        <Skeleton width="120px" height="32px" />
      </Text>
      <Skeleton width="100%" height="40px" />
      <div className={styles.grid}>
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
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
