import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    if (normalizedData?.completedAt) {
      stopPolling();
    } else if (enabled) {
      startPolling(POLLING_INTERVAL_MS);
    }

    return () => {
      stopPolling();
    };
  }, [enabled, normalizedData?.completedAt, stopPolling, startPolling]);

  return {
    data: normalizedData,
    error: error instanceof Error ? error : (error ? new Error(String(error)) : null),
    isLoading: loading,
    refetch: async () => {
      await refetch();
    },
  };
};
