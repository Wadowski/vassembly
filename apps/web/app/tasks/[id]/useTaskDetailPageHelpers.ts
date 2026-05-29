import { NotFoundError } from '@vassembly/errors';

import type { TaskDto } from '@vassembly/ui-api-hooks';

import {
  DOCUMENT_TITLE_MAX_LENGTH,
  DOCUMENT_TITLE_SUFFIX,
  TASK_DETAILS_PAGE_TITLE,
} from './constants';
import type { BuildTaskDetailPageViewArgs, TaskDetailPageView } from './useTaskDetailPageTypes';

export const isTaskNotFoundError = (error: unknown): boolean => error instanceof NotFoundError;

export const buildTaskDetailPageView = ({
  handleRetry,
  isNotFound,
  loadError,
  task,
}: BuildTaskDetailPageViewArgs): TaskDetailPageView => {
  if (isNotFound) {
    return { phase: 'notFound' };
  }

  if (loadError !== undefined) {
    return { phase: 'error', message: loadError, onRetry: handleRetry };
  }

  if (task === undefined) {
    return { phase: 'loading' };
  }

  return { phase: 'ready', task };
};

export const buildDocumentTitle = (task: TaskDto): string => {
  const trimmedTitle = task.title?.trim();
  if (!trimmedTitle) {
    return TASK_DETAILS_PAGE_TITLE;
  }

  const truncatedTitle =
    trimmedTitle.length > DOCUMENT_TITLE_MAX_LENGTH
      ? `${trimmedTitle.slice(0, DOCUMENT_TITLE_MAX_LENGTH)}…`
      : trimmedTitle;

  return `${truncatedTitle}${DOCUMENT_TITLE_SUFFIX}`;
};
