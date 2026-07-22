'use client';

import { SearchIcon, TagsIcon } from '@vassembly/ui-system-design/icons';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './SpecializationListEmptyState.module.scss';
import type { SpecializationListEmptyStateProps } from './types';

const EMPTY_CATALOG_MESSAGE =
  'No specializations have been created yet. They are generated automatically as users submit tasks.';

export const SpecializationListEmptyState = ({
  variant,
  searchQuery = '',
}: SpecializationListEmptyStateProps): JSX.Element => {
  const Icon = variant === 'no-specializations' ? TagsIcon : SearchIcon;
  const message =
    variant === 'no-specializations'
      ? EMPTY_CATALOG_MESSAGE
      : `No specializations match "${searchQuery}".`;

  return (
    <div className={styles.emptyState}>
      <Icon className={styles.icon} aria-hidden />
      <Text variant="body1">{message}</Text>
    </div>
  );
};
