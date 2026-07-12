import React from 'react';

import { Text } from '@vassembly/ui-text';

import { formatRelativeTime } from '../utils/formatRelativeTime';
import { formatTokens } from '../utils/formatTokens';
import {
  getTimelineItemAuthor,
  getTimelineItemDetail,
  getTimelineItemHeading,
  getTimelineItemNodeState,
} from '../utils/getTimelineItemTitle';
import type { ProgressItemProps } from '../types';
import styles from './ProgressItem.module.scss';

const toProgressItemState = (state: string): string => state.toLowerCase();

export const ProgressItem = React.memo<ProgressItemProps>(({ item, isSelected, onSelect, relativeTimeTick }) => {
  const rowClassName = isSelected
    ? `${styles.eventRow} ${styles.eventRowActive}`
    : styles.eventRow;
  const nodeState = getTimelineItemNodeState(item);
  const author = getTimelineItemAuthor(item);
  const heading = getTimelineItemHeading(item);
  const detail = getTimelineItemDetail(item);
  const isProgressEvent = item.kind === 'progress-event';

  if (!isProgressEvent) {
    return (
      <li className={rowClassName} data-testid={`timeline-item-${item.kind}`}>
        <span className={styles.eventNode} data-state={nodeState} aria-hidden />
        <div className={styles.eventContentStatic}>
          <Text variant="body2" className={styles.eventAuthor}>
            @{author}
          </Text>
          <Text variant="body2" className={styles.eventTitle}>
            {heading}
          </Text>
          {detail !== undefined ? (
            <Text variant="body2" className={styles.eventDetail}>
              {detail}
            </Text>
          ) : null}
          <Text variant="body2" className={styles.eventTimestamp} data-testid="progress-item-timestamp">
            {formatRelativeTime(item.timestamp)}
          </Text>
        </div>
      </li>
    );
  }

  const event = item.progressEvent;

  if (event === undefined) {
    return null;
  }

  const progressState = toProgressItemState(event.state);

  return (
    <li className={rowClassName}>
      <span className={styles.eventNode} data-state={nodeState} aria-hidden />
      <button
        className={styles.eventContent}
        onClick={(event) => onSelect(event.currentTarget)}
        type="button"
        aria-selected={isSelected}
        aria-label={`${author} - ${heading}`}
        data-testid="progress-item"
        data-state={progressState}
        data-timestamp={item.timestamp.toISOString()}
        data-event-id={item.id}
      >
        <Text variant="body2" className={styles.eventAuthor}>
          @{event.agentName}
        </Text>
        <Text variant="body2" className={styles.eventTitle}>
          {heading}
        </Text>
        {event.tokenUsage && (
          <Text variant="body2" className={styles.eventTokens}>
            {formatTokens(event.tokenUsage.total)} tokens
          </Text>
        )}
        <Text variant="body2" className={styles.eventTimestamp} data-testid="progress-item-timestamp">
          {formatRelativeTime(item.timestamp)}
        </Text>
      </button>
    </li>
  );
});

ProgressItem.displayName = 'ProgressItem';
