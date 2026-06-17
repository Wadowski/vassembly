import { useQuery } from '@apollo/client';
import { useEffect, useRef } from 'react';
import { POLLING_INTERVAL_MS } from '../constants/polling';
import { TASK_PROGRESS_QUERY } from '../graphql/taskProgressQuery';
import { normalizeTaskProgress } from '../utils/normalizeTaskProgress';
import type { TaskProgressData } from '../types';

interface UseProgressPollingOptions {
  taskId: string;
  enabled?: boolean;
}

interface UseProgressPollingResult {
  data: TaskProgressData | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useProgressPolling = ({ taskId, enabled = true }: UseProgressPollingOptions): UseProgressPollingResult => {
  const { data, error, loading, refetch, stopPolling, startPolling } = useQuery(TASK_PROGRESS_QUERY, {
    variables: { taskId },
    pollInterval: enabled ? POLLING_INTERVAL_MS : 0,
    fetchPolicy: 'network-only',
    skip: !enabled,
  });

  const normalizedData = data?.taskProgress ? normalizeTaskProgress(data.taskProgress) : null;
  const previousEnabledRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const previousEnabled = previousEnabledRef.current;
    previousEnabledRef.current = enabled;

    if (!enabled) {
      return () => {
        stopPolling();
      };
    }

    const isResuming = previousEnabled === false;

    if (isResuming) {
      void refetch();
      startPolling(POLLING_INTERVAL_MS);
    } else if (normalizedData?.completedAt) {
      stopPolling();
    } else {
      startPolling(POLLING_INTERVAL_MS);
    }

    return () => {
      stopPolling();
    };
  }, [enabled, normalizedData?.completedAt, stopPolling, startPolling, refetch]);

  return {
    data: normalizedData,
    error: error instanceof Error ? error : (error ? new Error(String(error)) : null),
    isLoading: loading,
    refetch: async () => {
      await refetch();
    },
  };
};
