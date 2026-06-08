'use client';

import { Text } from '@vassembly/ui-text';

import { McpListContainer } from './_components/McpListContainer/McpListContainer';
import styles from './McpsPageView.module.scss';

export const McpsPageView = (): JSX.Element => {
  return (
    <main className={styles.pageStack}>
      <header className={styles.pageHeader}>
        <Text variant="h1" as="h1">
          MCPs
        </Text>
      </header>
      <McpListContainer />
    </main>
  );
};
