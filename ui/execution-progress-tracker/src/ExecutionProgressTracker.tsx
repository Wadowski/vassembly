import React, { useEffect } from 'react';
import { TaskStatus } from '@vassembly/ui-api-hooks/src/tasks/types';
import { ProgressList } from './_components/ProgressList';
import { ProgressDetailModal } from './_components/ProgressDetailModal';
import { ProgressHeader } from './_components/ProgressHeader';
import { useProgressPolling } from './hooks/useProgressPolling';
import { useModalState } from './hooks/useModalState';
import { sortEventsByTimestamp } from './utils/sortEventsByTimestamp';
import { mergeTimelineItems } from './utils/mergeTimelineItems';
import type { ExecutionProgressTrackerProps, ProgressEvent } from './types';
import styles from './ExecutionProgressTracker.module.scss';

export const ExecutionProgressTracker: React.FC<ExecutionProgressTrackerProps> = ({
  taskId,
  taskStatus,
  answeredQuestions,
  onTaskCompleted,
}) => {
  const isProgressable =
    taskStatus === TaskStatus.InProgress || taskStatus === TaskStatus.Waiting;
  const { data, error, isLoading, refetch } = useProgressPolling({ taskId, enabled: isProgressable });
  const { isOpen, selectedEventId, openModal, closeModal } = useModalState();

  useEffect(() => {
    if (isProgressable && !isLoading) {
      void refetch();
    }
  }, [isProgressable, refetch, isLoading]);

  useEffect(() => {
    if (data?.completedAt) {
      onTaskCompleted?.(data);
    }
  }, [data?.completedAt, data, onTaskCompleted]);

  if (isLoading && !data) {
    return (
      <div className={styles.executionProgressTracker} data-testid="execution-progress-tracker">
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.executionProgressTracker} data-testid="execution-progress-tracker">
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>{error.message || 'Failed to load progress'}</p>
          <button className={styles.retryButton} onClick={() => refetch()} type="button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.executionProgressTracker} data-testid="execution-progress-tracker">
        <div className={styles.emptyState}>
          <p>No progress data available</p>
        </div>
      </div>
    );
  }

  const sortedEvents = sortEventsByTimestamp(data.events);
  const timelineItems = mergeTimelineItems({
    events: sortedEvents,
    answeredQuestions,
  });
  const selectedEvent = selectedEventId
    ? sortedEvents.find((event: ProgressEvent) => event.id === selectedEventId)
    : null;

  return (
    <div className={styles.executionProgressTracker} data-testid="execution-progress-tracker">
      <ProgressHeader taskProgress={data} taskStatus={taskStatus} />

      <ProgressList
        items={timelineItems}
        selectedEventId={selectedEventId}
        onSelectEvent={openModal}
      />

      <ProgressDetailModal
        isOpen={isOpen}
        event={selectedEvent || null}
        onClose={closeModal}
      />
    </div>
  );
};
