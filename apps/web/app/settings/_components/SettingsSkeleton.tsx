'use client';

import { Skeleton } from '@vassembly/ui-skeleton';
import { Text } from '@vassembly/ui-text';
import styles from './SettingsSkeleton.module.scss';

export function SettingsSkeleton(): JSX.Element {
  return (
    <main className={styles.container}>
      <Text variant="h1">
        <Skeleton width="200px" height="32px" />
      </Text>
      <div className={styles.sections}>
        <div>
          <Skeleton width="150px" height="24px" className={styles.sectionLabel} />
          <Skeleton width="100%" height="100px" />
        </div>
        <div>
          <Skeleton width="150px" height="24px" className={styles.sectionLabel} />
          <Skeleton width="100%" height="100px" />
        </div>
        <div>
          <Skeleton width="150px" height="24px" className={styles.sectionLabel} />
          <Skeleton width="100%" height="100px" />
        </div>
      </div>
    </main>
  );
}
