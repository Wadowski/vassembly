import { useQuery } from '@apollo/client';
import { useEffect, useRef } from 'react';

import { POLLING_INTERVAL_MS } from '../constants/polling';
import { TASK_PROGRESS_BY_COMMENT_QUERY } from '../graphql/taskProgressByCommentQuery';
import { normalizeTaskProgress } from '../utils/normalizeTaskProgress';

import type { TaskProgressData } from '../types';

interface UseCommentProgressPollingParams {
  taskId: string;
  commentId: string;
  enabled?: boolean;
}

interface UseCommentProgressPollingResult {
  data: TaskProgressData | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useCommentProgressPolling = ({
  taskId,
  commentId,
  enabled = true,
}: UseCommentProgressPollingParams): UseCommentProgressPollingResult => {
  const { data, error, loading, refetch, stopPolling, startPolling } = useQuery(
    TASK_PROGRESS_BY_COMMENT_QUERY,
    {
      variables: { taskId, commentId },
      pollInterval: enabled ? POLLING_INTERVAL_MS : 0,
      fetchPolicy: 'network-only',
      skip: !enabled,
    },
  );

  const normalizedData = data?.taskProgressByComment
    ? normalizeTaskProgress(data.taskProgressByComment)
    : null;
  const previousEnabledRef = useRef<boolean | undefined>(undefined);
  const previousCommentIdRef = useRef<string>(commentId);

  useEffect(() => {
    const previousEnabled = previousEnabledRef.current;
    previousEnabledRef.current = enabled;
    const isResuming = previousEnabled === false && enabled;

    const previousCommentId = previousCommentIdRef.current;
    previousCommentIdRef.current = commentId;
    const isCommentChanged = previousCommentId !== commentId;

    if (!enabled) {
      stopPolling();
      return () => {
        stopPolling();
      };
    }

    if (normalizedData?.completedAt && !isResuming && !isCommentChanged) {
      stopPolling();
      return () => {
        stopPolling();
      };
    }

    if (isResuming || isCommentChanged) {
      void refetch();
    }

    startPolling(POLLING_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [commentId, enabled, normalizedData?.completedAt, stopPolling, startPolling, refetch]);

  return {
    data: normalizedData,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    isLoading: loading,
    refetch: async (): Promise<void> => {
      await refetch();
    },
  };
};
