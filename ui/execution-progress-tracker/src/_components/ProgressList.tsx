import React from 'react';
import { ProgressItem } from './ProgressItem';
import type { ProgressListProps } from '../types';
import styles from './ProgressList.module.scss';

export const ProgressList: React.FC<ProgressListProps> = ({
  items,
  selectedEventId,
  onSelectEvent,
  isLoading = false,
  emptyMessage = 'No progress events yet. Waiting for execution to start...',
}) => {
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
        />
      ))}
    </ul>
  );
};
