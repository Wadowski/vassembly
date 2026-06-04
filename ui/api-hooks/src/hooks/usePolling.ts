import { useEffect } from 'react';

interface UsePollingOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export const usePolling = (
  { enabled = true, intervalMs = 3000 }: UsePollingOptions,
  callback: () => Promise<void> | void,
): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      void Promise.resolve(callback()).catch(() => undefined);
    }, intervalMs);

    return (): void => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [callback, enabled, intervalMs]);
};
