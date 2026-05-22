'use client';

import { Skeleton } from '@vassembly/ui-skeleton';
import { Text } from '@vassembly/ui-text';
import styles from './AgentCreateSkeleton.module.scss';

export function AgentCreateSkeleton(): JSX.Element {
  return (
    <main className={styles.container}>
      <Text variant="h1">
        <Skeleton width="200px" height="32px" />
      </Text>
      <div className={styles.fields}>
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="40px" />
      </div>
    </main>
  );
}
