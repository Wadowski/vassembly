import type { TaskProgressModel, TokenUsage } from '@vassembly/domain-task-progress';

export interface AggregatedProgressStats {
  totalDuration?: number;
  totalTokens?: TokenUsage;
}

const sumMetricsFromEvents = (
  progress: TaskProgressModel,
): { duration: number; tokens: TokenUsage } => {
  let duration = 0;
  let input = 0;
  let output = 0;

  for (const event of progress.events ?? []) {
    if (event.duration !== undefined) {
      duration += event.duration;
    }

    if (event.tokenUsage) {
      input += event.tokenUsage.input;
      output += event.tokenUsage.output;
    }
  }

  return {
    duration,
    tokens: {
      input,
      output,
      total: input + output,
    },
  };
};

const computeWallClockDuration = (progress: TaskProgressModel): number => {
  const events = progress.events ?? [];

  if (events.length < 2) {
    return 0;
  }

  const first = events[0]?.timestamp;
  const last = events[events.length - 1]?.timestamp;

  if (!first || !last) {
    return 0;
  }

  return new Date(last).getTime() - new Date(first).getTime();
};

export const aggregateProgressStats = (
  progress: TaskProgressModel | null | undefined,
): AggregatedProgressStats => {
  if (!progress) {
    return {};
  }

  const fromEvents = sumMetricsFromEvents(progress);
  const storedDuration = progress.totalDuration ?? 0;
  const storedTokens = progress.totalTokens;
  const storedTokenTotal = storedTokens?.total ?? 0;

  const wallClockDuration = computeWallClockDuration(progress);

  const totalDuration =
    storedDuration > 0
      ? storedDuration
      : fromEvents.duration > 0
        ? fromEvents.duration
        : wallClockDuration;

  const totalTokens: TokenUsage =
    storedTokenTotal > 0
      ? storedTokens!
      : fromEvents.tokens;

  if (totalDuration <= 0 && totalTokens.total <= 0) {
    return {};
  }

  return {
    totalDuration,
    totalTokens,
  };
};
