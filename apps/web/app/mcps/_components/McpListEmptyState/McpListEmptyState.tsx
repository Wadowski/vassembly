'use client';

import { BookOpenTextIcon, SearchIcon } from '@vassembly/ui-icons';
import { Text } from '@vassembly/ui-text';

import styles from './McpListEmptyState.module.scss';
import type { McpListEmptyStateProps } from './types';

const EMPTY_STATE_COPY = {
  'no-mcps': 'No MCPs available',
  'no-results': 'No MCPs matching your search',
} as const;

export const McpListEmptyState = ({ variant }: McpListEmptyStateProps): JSX.Element => {
  const Icon = variant === 'no-mcps' ? BookOpenTextIcon : SearchIcon;
  const message = EMPTY_STATE_COPY[variant];

  return (
    <div className={styles.emptyState}>
      <Icon className={styles.icon} aria-hidden />
      <Text variant="body1">{message}</Text>
    </div>
  );
};
