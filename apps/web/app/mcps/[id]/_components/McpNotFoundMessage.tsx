'use client';

import Link from 'next/link';

import { Text } from '@vassembly/ui-system-design/text';

import { NOT_FOUND_MESSAGE } from './constants';
import styles from './McpDetailPageStates.module.scss';

/**
 * Not-found state when an MCP id does not exist.
 */
export const McpNotFoundMessage = (): JSX.Element => {
  return (
    <main className={styles.statePage}>
      <Text variant="h1" as="h1">{NOT_FOUND_MESSAGE}</Text>
      <Link href="/mcps" className={styles.backLink}>Back to MCPs</Link>
    </main>
  );
};
