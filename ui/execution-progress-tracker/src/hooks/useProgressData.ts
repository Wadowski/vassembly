import { useMemo } from 'react';
import { calculateMetrics } from '../utils/calculateMetrics';
import type { ProgressEvent } from '../types';

interface UseProgressDataResult {
  totalDuration: number;
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
}

export const useProgressData = (events: ProgressEvent[]): UseProgressDataResult => {
  const metrics = useMemo(() => {
    return calculateMetrics(events);
  }, [events]);

  return {
    totalDuration: metrics.totalDuration,
    totalTokens: metrics.totalTokens,
  };
};
