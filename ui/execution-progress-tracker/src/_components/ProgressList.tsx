import React, { useEffect, useState } from 'react';
import { ProgressItem } from './ProgressItem';
import type { ProgressListProps } from '../types';
import styles from './ProgressList.module.scss';

const RELATIVE_TIME_UPDATE_INTERVAL_MS = 30_000;

export const ProgressList: React.FC<ProgressListProps> = ({
  items,
  selectedEventId,
  onSelectEvent,
  isLoading = false,
  emptyMessage = 'No progress events yet. Waiting for execution to start...',
}) => {
  const [relativeTimeTick, setRelativeTimeTick] = useState(0);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setRelativeTimeTick((current) => current + 1);
    }, RELATIVE_TIME_UPDATE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [items.length]);

  if (isLoading) {
    return (
      <div
        className={styles.progressListEmpty}
        data-testid="progress-list"
        role="status"
      >
        <div className={styles.loadingSpinner} aria-hidden />
        <p data-testid="progress-loading-state">Loading progress events...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={styles.progressListEmpty}
        data-testid="progress-list"
        role="status"
      >
        <p data-testid="progress-empty-state">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className={styles.eventList} data-testid="progress-list" aria-label="Progress events list">
      {items.map((item) => (
        <ProgressItem
          key={item.id}
          item={item}
          isSelected={selectedEventId === item.id}
          onSelect={(trigger) => onSelectEvent(item.id, trigger)}
          relativeTimeTick={relativeTimeTick}
        />
      ))}
    </ul>
  );
};
