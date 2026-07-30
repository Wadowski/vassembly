import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { formatDuration, getProgressEventTitle } from '@vassembly/ui-execution-progress-tracker';

export interface GetProgressRowTitleParams {
  item: TaskActivityItemDto;
}

const normalizeProgressState = (state: string | null | undefined): string => {
  if (!state) {
    return 'STARTED';
  }

  return state.toUpperCase();
};

export const getProgressRowTitle = ({ item }: GetProgressRowTitleParams): string => {
  return getProgressEventTitle({
    state: normalizeProgressState(item.state) as 'STARTED' | 'COMPLETED' | 'FAILED' | 'WAITING',
    duration: item.duration ?? null,
    errorDetails: item.errorDetails
      ? {
          message: item.errorDetails.message,
          type: item.errorDetails.type ?? 'Error',
          stackTrace: item.errorDetails.stackTrace ?? undefined,
        }
      : null,
  });
};

export const getProgressRowSubtitle = ({ item }: GetProgressRowTitleParams): string => {
  const parts: string[] = [];

  if (item.provider) {
    parts.push(item.provider);
  }

  if (item.model) {
    parts.push(item.model);
  }

  if (item.duration !== null && item.duration !== undefined) {
    parts.push(formatDuration(item.duration));
  }

  return parts.join(' · ');
};
