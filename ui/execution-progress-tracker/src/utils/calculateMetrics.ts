import type { ProgressEvent, TokenUsage } from '../types';

export interface Metrics {
  totalDuration: number;
  totalTokens: TokenUsage;
}

export const calculateMetrics = (events: ProgressEvent[]): Metrics => {
  let totalDuration = 0;
  const totalTokens: TokenUsage = {
    input: 0,
    output: 0,
    total: 0,
  };

  events.forEach((event) => {
    if (event.duration !== null) {
      totalDuration += event.duration;
    }

    if (event.tokenUsage) {
      totalTokens.input += event.tokenUsage.input;
      totalTokens.output += event.tokenUsage.output;
      totalTokens.total += event.tokenUsage.total;
    }
  });

  return {
    totalDuration,
    totalTokens,
  };
};
