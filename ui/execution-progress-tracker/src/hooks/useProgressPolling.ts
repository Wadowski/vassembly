import { useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { POLLING_INTERVAL_MS } from '../constants/polling';
import { TASK_PROGRESS_QUERY } from '../graphql/taskProgressQuery';
import { normalizeTaskProgress } from '../utils/normalizeTaskProgress';
import type { TaskProgressData } from '../types';

interface UseProgressPollingOptions {
  taskId: string;
  isPollingEnabled?: boolean;
  isFetchEnabled?: boolean;
}

interface UseProgressPollingResult {
  data: TaskProgressData | null;
  error: Error | null;
  isLoading: boolean;
  pollRequestCount: number;
  refetch: () => Promise<void>;
}

export const useProgressPolling = ({
  taskId,
  isPollingEnabled = true,
  isFetchEnabled = true,
}: UseProgressPollingOptions): UseProgressPollingResult => {
  const [pollRequestCount, setPollRequestCount] = useState(0);
  const { data, error, loading, refetch, stopPolling, startPolling } = useQuery(TASK_PROGRESS_QUERY, {
    variables: { taskId },
    pollInterval: isPollingEnabled ? POLLING_INTERVAL_MS : 0,
    fetchPolicy: 'network-only',
    skip: !isFetchEnabled,
    onCompleted: () => {
      setPollRequestCount((current) => current + 1);
    },
  });

  const normalizedData = data?.taskProgress ? normalizeTaskProgress(data.taskProgress) : null;
  const previousPollingEnabledRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const previousPollingEnabled = previousPollingEnabledRef.current;
    previousPollingEnabledRef.current = isPollingEnabled;

    if (!isFetchEnabled || !isPollingEnabled || normalizedData?.completedAt) {
      stopPolling();
      return () => {
        stopPolling();
      };
    }

    const isResuming = previousPollingEnabled === false;

    if (isResuming) {
      void refetch();
      startPolling(POLLING_INTERVAL_MS);
    } else {
      startPolling(POLLING_INTERVAL_MS);
    }

    return () => {
      stopPolling();
    };
  }, [
    isFetchEnabled,
    isPollingEnabled,
    normalizedData?.completedAt,
    stopPolling,
    startPolling,
    refetch,
  ]);

  return {
    data: normalizedData,
    error: error instanceof Error ? error : (error ? new Error(String(error)) : null),
    isLoading: loading,
    pollRequestCount,
    refetch: async () => {
      await refetch();
    },
  };
};
