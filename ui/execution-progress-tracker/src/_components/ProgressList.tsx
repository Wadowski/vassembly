import React from 'react';
import { ProgressItem } from './ProgressItem';
import type { ProgressListProps } from '../types';
import styles from './ProgressList.module.scss';

export const ProgressList: React.FC<ProgressListProps> = ({ events, selectedEventId, onSelectEvent }) => {
  if (events.length === 0) {
    return (
      <div className={styles.progressListEmpty} role="status">
        <p>No progress events yet. Waiting for execution to start...</p>
      </div>
    );
  }

  return (
    <ul className={styles.eventList} aria-label="Progress events list">
      {events.map((event) => (
        <ProgressItem
          key={event.id}
          event={event}
          isSelected={selectedEventId === event.id}
          onSelect={() => onSelectEvent(event.id)}
        />
      ))}
    </ul>
  );
};
