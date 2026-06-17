import React from 'react';
import { ProgressItem } from './ProgressItem';
import type { ProgressListProps } from '../types';
import styles from './ProgressList.module.scss';

export const ProgressList: React.FC<ProgressListProps> = ({ items, selectedEventId, onSelectEvent }) => {
  if (items.length === 0) {
    return (
      <div className={styles.progressListEmpty} role="status">
        <p>No progress events yet. Waiting for execution to start...</p>
      </div>
    );
  }

  return (
    <ul className={styles.eventList} aria-label="Progress events list">
      {items.map((item) => (
        <ProgressItem
          key={item.id}
          item={item}
          isSelected={selectedEventId === item.id}
          onSelect={() => onSelectEvent(item.id)}
        />
      ))}
    </ul>
  );
};
