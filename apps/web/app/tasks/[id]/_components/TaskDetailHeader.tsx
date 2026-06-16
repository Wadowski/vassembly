'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  TaskStatus,
  usePauseTask,
  useResumeTask,
  useRetryTask,
} from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-button';
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

export const TaskDetailHeader = ({
  task,
  onTaskUpdated,
}: TaskDetailHeaderProps): JSX.Element => {
  const router = useRouter();
  const { pauseTask, isLoading: isPausing } = usePauseTask();
  const { resumeTask, isLoading: isResuming } = useResumeTask();
  const { retryTask, isLoading: isRetrying } = useRetryTask();
  const pageTitle = task.title?.trim() ? task.title.trim() : TASK_DETAILS_PAGE_TITLE;
  const isAnyActionLoading = isPausing || isResuming || isRetrying;
  const isFailedOnly = task.status === TaskStatus.Failed;

  const handleBackClick = useCallback((): void => {
    router.push('/');
  }, [router]);

  const handlePause = useCallback(async (): Promise<void> => {
    await pauseTask({ id: task.id });
    await onTaskUpdated();
  }, [onTaskUpdated, pauseTask, task.id]);

  const handleResume = useCallback(async (): Promise<void> => {
    await resumeTask({ id: task.id });
    await onTaskUpdated();
  }, [onTaskUpdated, resumeTask, task.id]);

  const handleRetry = useCallback(async (): Promise<void> => {
    await retryTask({ id: task.id });
    await onTaskUpdated();
  }, [onTaskUpdated, retryTask, task.id]);

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
