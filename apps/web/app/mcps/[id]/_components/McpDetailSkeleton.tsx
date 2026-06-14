'use client';

import { Skeleton } from '@vassembly/ui-skeleton';

import styles from './McpDetailSkeleton.module.scss';

/**
 * Loading skeleton for the MCP detail page.
 */
export const McpDetailSkeleton = (): JSX.Element => {
  return (
    <main className={styles.page}>
      <Skeleton width="240px" height="32px" />
      <Skeleton width="100%" height="120px" />
      <Skeleton width="100%" height="320px" />
    </main>
  );
};
