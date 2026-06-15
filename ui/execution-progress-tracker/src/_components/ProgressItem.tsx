import React from 'react';

import { Text } from '@vassembly/ui-text';

import { formatRelativeTime } from '../utils/formatRelativeTime';
import { formatTokens } from '../utils/formatTokens';
import { getProgressEventTitle } from '../utils/getProgressEventTitle';
import type { ProgressItemProps } from '../types';
import styles from './ProgressItem.module.scss';

export const ProgressItem = React.memo<ProgressItemProps>(({ event, isSelected, onSelect }) => {
  const rowClassName = isSelected
    ? `${styles.eventRow} ${styles.eventRowActive}`
    : styles.eventRow;

  return (
    <li className={rowClassName}>
      <span className={styles.eventNode} data-state={event.state} aria-hidden />
      <button
        className={styles.eventContent}
        onClick={onSelect}
        type="button"
        aria-selected={isSelected}
        aria-label={`${event.agentName} - ${getProgressEventTitle(event)}`}
      >
        <Text variant="body2" className={styles.eventAuthor}>
          @{event.agentName}
        </Text>
        <Text variant="body2" className={styles.eventTitle}>
          {getProgressEventTitle(event)}
        </Text>
        {event.tokenUsage && (
          <Text variant="body2" className={styles.eventTokens}>
            {formatTokens(event.tokenUsage.total)} tokens
          </Text>
        )}
        <Text variant="body2" className={styles.eventTimestamp}>
          {formatRelativeTime(event.timestamp)}
        </Text>
      </button>
    </li>
  );
});

ProgressItem.displayName = 'ProgressItem';
