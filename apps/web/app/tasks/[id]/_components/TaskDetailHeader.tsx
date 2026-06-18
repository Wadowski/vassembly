'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CommonError, ConflictError } from '@vassembly/errors';
import {
  TaskStatus,
  usePauseTask,
  useResumeTask,
  useRetryTask,
} from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-button';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { Text } from '@vassembly/ui-text';
import {
  ArrowLeftIcon,
  ButtonLoopArrowIcon,
  ButtonPauseIcon,
  ButtonPlayIcon,
} from '@vassembly/ui-icons';

import { TASK_DETAILS_PAGE_TITLE } from '../constants';
import pageStyles from '../TaskDetailPage.module.scss';
import { TaskStatusBadge } from './TaskStatusBadge';
import type { TaskDetailHeaderProps } from './types';

const getTaskActionErrorMessage = ({
  error,
  action,
}: {
  error: unknown;
  action: 'pause' | 'resume' | 'retry';
}): string => {
  if (error instanceof ConflictError && action === 'pause') {
    return 'This task can no longer be paused.';
  }

  if (error instanceof CommonError) {
    if (action === 'pause' && /not in-progress|not pausable/i.test(error.message)) {
      return 'This task can no longer be paused.';
    }

    return error.message;
  }

  return `Unable to ${action} task.`;
};

export const TaskDetailHeader = ({
  task,
  onTaskUpdated,
}: TaskDetailHeaderProps): JSX.Element => {
  const router = useRouter();
  const snackbar = useSnackbar();
  const { pauseTask, isLoading: isPausing } = usePauseTask();
  const { resumeTask, isLoading: isResuming } = useResumeTask();
  const { retryTask, isLoading: isRetrying } = useRetryTask();
  const pageTitle = task.title?.trim() ? task.title.trim() : TASK_DETAILS_PAGE_TITLE;
  const [isPauseLocked, setIsPauseLocked] = useState(false);
  const isPauseLockedRef = useRef(false);
  const isAnyActionLoading = isPausing || isResuming || isRetrying || isPauseLocked;
  const isFailedOnly = task.status === TaskStatus.Failed;

  const handleBackClick = useCallback((): void => {
    router.push('/');
  }, [router]);

  const handlePause = useCallback(async (): Promise<void> => {
    if (isPauseLockedRef.current) {
      return;
    }

    isPauseLockedRef.current = true;
    setIsPauseLocked(true);

    try {
      await pauseTask({ id: task.id });
      await onTaskUpdated();
      isPauseLockedRef.current = false;
      setIsPauseLocked(false);
    } catch (error: unknown) {
      isPauseLockedRef.current = false;
      setIsPauseLocked(false);
      snackbar.show({
        variant: 'error',
        message: getTaskActionErrorMessage({ error, action: 'pause' }),
        duration: 5000,
      });
    }
  }, [onTaskUpdated, pauseTask, snackbar, task.id]);

  const handleResume = useCallback(async (): Promise<void> => {
    try {
      await resumeTask({ id: task.id });
      await onTaskUpdated();
    } catch (error: unknown) {
      snackbar.show({
        variant: 'error',
        message: getTaskActionErrorMessage({ error, action: 'resume' }),
        duration: 5000,
      });
    }
  }, [onTaskUpdated, resumeTask, snackbar, task.id]);

  const handleRetry = useCallback(async (): Promise<void> => {
    try {
      await retryTask({ id: task.id });
      await onTaskUpdated();
    } catch (error: unknown) {
      snackbar.show({
        variant: 'error',
        message: getTaskActionErrorMessage({ error, action: 'retry' }),
        duration: 5000,
      });
    }
  }, [onTaskUpdated, retryTask, snackbar, task.id]);

  return (
    <header>
      <div className={pageStyles.utilityHeader}>
        <Button
          className={pageStyles.backLink}
          variant="text"
          color="primary"
          icon={ArrowLeftIcon}
          text="Back to tasks"
          onClick={handleBackClick}
          data-testid="task-detail-back"
          aria-label="Back to tasks"
        />
        <div className={pageStyles.utilityHeaderEnd}>
          <div
            className={pageStyles.headerActionButtons}
            role="group"
            aria-label="Task actions"
          >
            {task.status === TaskStatus.InProgress ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                icon={ButtonPauseIcon}
                text="Pause"
                aria-label="Pause task"
                aria-busy={isPausing}
                data-testid="task-pause-button"
                isLoading={isPausing}
                isDisabled={isAnyActionLoading}
                onClick={handlePause}
              />
            ) : null}
            {task.status === TaskStatus.Paused ? (
              <Button
                variant="contained"
                color="primary"
                size="small"
                icon={ButtonPlayIcon}
                text="Resume"
                aria-label="Resume task"
                aria-busy={isResuming}
                data-testid="task-resume-button"
                isLoading={isResuming}
                isDisabled={isAnyActionLoading}
                onClick={handleResume}
              />
            ) : null}
            {task.status === TaskStatus.Paused || task.status === TaskStatus.Failed ? (
              <Button
                variant={isFailedOnly ? 'contained' : 'outlined'}
                color={isFailedOnly ? 'primary' : 'secondary'}
                size="small"
                icon={ButtonLoopArrowIcon}
                text="Retry"
                aria-label="Retry task"
                aria-busy={isRetrying}
                data-testid="task-retry-button"
                isLoading={isRetrying}
                isDisabled={isAnyActionLoading}
                onClick={handleRetry}
              />
            ) : null}
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
      </div>
      <Text variant="h1" className={pageStyles.pageTitle} data-testid="task-detail-title">
        {pageTitle}
      </Text>
    </header>
  );
};
