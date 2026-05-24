'use client';

import { Skeleton } from '@vassembly/ui-skeleton';
import { Text } from '@vassembly/ui-text';
import styles from './styles.module.scss';

export function AgentsSkeleton(): JSX.Element {
  return (
    <main className={styles.container}>
      <Text variant="h1">
        <Skeleton width="200px" height="32px" />
      </Text>
      <div className={styles.toolbarRow}>
        <Skeleton width="140px" height="40px" />
        <Skeleton width="100%" height="40px" />
        <Skeleton width="180px" height="40px" />
      </div>
      <div className={styles.toolbarRow}>
        <Skeleton width="120px" height="40px" />
        <Skeleton width="200px" height="20px" />
        <Skeleton width="120px" height="40px" />
      </div>
      <table aria-busy={true}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td>
                <Skeleton width="150px" height="20px" />
              </td>
              <td>
                <Skeleton width="80px" height="20px" />
              </td>
              <td>
                <div className={styles.toolbarRow}>
                  <Skeleton width="60px" height="20px" />
                  <Skeleton width="70px" height="20px" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
