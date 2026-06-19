import React from 'react';
import { TaskStatus } from '@vassembly/ui-api-hooks/src/tasks/types';
import { ProgressList } from './_components/ProgressList';
import { ProgressDetailModal } from './_components/ProgressDetailModal';
import { ProgressHeader } from './_components/ProgressHeader';
import { useProgressPolling } from './hooks/useProgressPolling';
import { useModalState } from './hooks/useModalState';
import { sortEventsByTimestamp } from './utils/sortEventsByTimestamp';
import { mergeTimelineItems } from './utils/mergeTimelineItems';
import { isProgressNotFoundError } from './utils/isProgressNotFoundError';
import type { ExecutionProgressTrackerProps, ProgressEvent } from './types';
import styles from './ExecutionProgressTracker.module.scss';

const isActiveProgressStatus = (
  taskStatus: ExecutionProgressTrackerProps['taskStatus'],
): boolean => taskStatus === TaskStatus.InProgress || taskStatus === TaskStatus.Waiting;

const shouldFetchProgressForStatus = (
  taskStatus: ExecutionProgressTrackerProps['taskStatus'],
  hasAssignedAgent: boolean,
): boolean => {
  if (!hasAssignedAgent) {
    return false;
  }

  return (
    taskStatus === TaskStatus.InProgress ||
    taskStatus === TaskStatus.Waiting ||
    taskStatus === TaskStatus.Paused ||
    taskStatus === TaskStatus.Done ||
    taskStatus === TaskStatus.Failed
  );
};

export const ExecutionProgressTracker: React.FC<ExecutionProgressTrackerProps> = ({
  taskId,
  taskStatus,
  hasAssignedAgent = true,
  answeredQuestions,
  onTaskCompleted,
}) => {
  const isFetchEnabled = shouldFetchProgressForStatus(taskStatus, hasAssignedAgent);
  const isPollingEnabled = hasAssignedAgent && isActiveProgressStatus(taskStatus);
  const { data, error, isLoading, pollRequestCount, refetch } = useProgressPolling({
    taskId,
    isPollingEnabled,
    isFetchEnabled,
  });
  const { isOpen, selectedEventId, openModal, closeModal } = useModalState();
  const completedNotifiedRef = React.useRef(false);

  React.useEffect(() => {
    if (!data?.completedAt || completedNotifiedRef.current) {
      return;
    }

    completedNotifiedRef.current = true;
    onTaskCompleted?.(data);
  }, [data, onTaskCompleted]);

  const hasProgressData = data !== null;
  const isNotFound = error !== null && isProgressNotFoundError(error);
  const hasBlockingError = error !== null && !isNotFound && !hasProgressData;

  if (hasBlockingError) {
    return (
      <div className={styles.executionProgressTracker} data-testid="execution-progress-tracker">
        <div className={styles.errorState} data-testid="progress-error-banner" role="alert">
          <p className={styles.errorMessage}>{error.message || 'Failed to load progress'}</p>
          <button
            className={styles.retryButton}
            data-testid="progress-retry-button"
            onClick={() => refetch()}
            type="button"
          >
            Retry
          </button>
        </div>
        <span data-testid="polling-request-count" hidden>
          {pollRequestCount}
        </span>
      </div>
    );
  }

  const sortedEvents = hasProgressData ? sortEventsByTimestamp(data.events) : [];
  const timelineItems = mergeTimelineItems({
    events: sortedEvents,
    answeredQuestions,
  });
  const selectedEvent = selectedEventId
    ? sortedEvents.find((event: ProgressEvent) => event.id === selectedEventId)
    : null;
  const showInitialLoading = isLoading && !hasProgressData && !isNotFound;
  const showCompletionMessage = taskStatus === TaskStatus.Done && hasProgressData;

  return (
    <div className={styles.executionProgressTracker} data-testid="execution-progress-tracker">
      {showCompletionMessage ? (
        <p data-testid="completion-message">Task execution completed</p>
      ) : null}

      {hasProgressData ? (
        <ProgressHeader taskProgress={data} taskStatus={taskStatus} />
      ) : null}

      <ProgressList
        items={timelineItems}
        selectedEventId={selectedEventId}
        onSelectEvent={openModal}
        isLoading={showInitialLoading}
        emptyMessage={
          isFetchEnabled
            ? 'No progress events yet. Waiting for execution to start...'
            : 'No progress data available'
        }
      />

      <ProgressDetailModal
        isOpen={isOpen}
        event={selectedEvent || null}
        onClose={closeModal}
      />

      <span data-testid="polling-request-count" hidden>
        {pollRequestCount}
      </span>
    </div>
  );
};
