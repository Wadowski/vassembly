'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import type { TaskDto } from '@vassembly/ui-api-hooks';
import { TaskStatus, usePolling, useTaskDetail } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { getRequestErrorMessage } from '../../agents/getRequestErrorMessage';
import { TASK_LOAD_ERROR_FALLBACK } from './constants';
import {
  buildDocumentTitle,
  buildTaskDetailPageView,
  isTaskNotFoundError,
} from './useTaskDetailPageHelpers';
import type { UseTaskDetailPageResult } from './useTaskDetailPageTypes';

export type { TaskDetailPageView, UseTaskDetailPageResult } from './useTaskDetailPageTypes';

export const useTaskDetailPage = (): UseTaskDetailPageResult => {
  const params = useParams();
  const snackbar = useSnackbar();
  const { fetch } = useTaskDetail();
  const taskIdParam = typeof params?.id === 'string' ? params.id : '';

  const [task, setTask] = useState<TaskDto | undefined>(undefined);
  const [isNotFound, setIsNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [loadVersion, setLoadVersion] = useState(0);

  const loginRoute =
    taskIdParam === ''
      ? `/login?returnUrl=${encodeURIComponent('/')}`
      : `/login?returnUrl=${encodeURIComponent(`/tasks/${taskIdParam}`)}`;

  useEffect(() => {
    if (taskIdParam === '') {
      setIsNotFound(true);
      setTask(undefined);
      setLoadError(undefined);
      return;
    }

    let cancelled = false;
    setTask(undefined);
    setIsNotFound(false);
    setLoadError(undefined);

    const load = async (): Promise<void> => {
      try {
        const loadedTask = await fetch(taskIdParam);
        if (!cancelled) {
          setTask(loadedTask);
          setIsNotFound(false);
          setLoadError(undefined);
        }
      } catch (error) {
        if (!cancelled) {
          setTask(undefined);

          if (isTaskNotFoundError(error)) {
            setIsNotFound(true);
            setLoadError(undefined);
            return;
          }

          const message = getRequestErrorMessage(error, TASK_LOAD_ERROR_FALLBACK);
          setIsNotFound(false);
          setLoadError(message);
          snackbar.show({ variant: 'error', message, duration: 5000 });
        }
      }
    };

    void load();

    return (): void => {
      cancelled = true;
    };
  }, [fetch, loadVersion, snackbar, taskIdParam]);

  const pollCallback = useCallback(async (): Promise<void> => {
    const loadedTask = await fetch(taskIdParam);
    setTask(loadedTask);
  }, [fetch, taskIdParam]);

  usePolling(
    { enabled: task?.status === TaskStatus.InProgress && taskIdParam !== '', intervalMs: 3000 },
    pollCallback,
  );

  useEffect(() => {
    if (task === undefined) {
      return;
    }

    const previousTitle = document.title;
    document.title = buildDocumentTitle(task);

    return (): void => {
      document.title = previousTitle;
    };
  }, [task]);

  const handleRetry = useCallback((): void => {
    setTask(undefined);
    setIsNotFound(false);
    setLoadError(undefined);
    setLoadVersion((current) => current + 1);
  }, []);

  const view = useMemo(
    () => buildTaskDetailPageView({ handleRetry, isNotFound, loadError, task }),
    [handleRetry, isNotFound, loadError, task],
  );

  return {
    loginRoute,
    view,
  };
};
