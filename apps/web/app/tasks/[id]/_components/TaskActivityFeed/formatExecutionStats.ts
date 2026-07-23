import { formatDuration, formatTokens } from '@vassembly/ui-execution-progress-tracker';

export interface ActivityTokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface FormatExecutionStatsParams {
  durationMs?: number | null;
  tokenUsage?: ActivityTokenUsage | null;
}

const hasTokenUsage = (tokenUsage: ActivityTokenUsage): boolean => {
  return tokenUsage.input > 0 || tokenUsage.output > 0 || tokenUsage.total > 0;
};

export const formatExecutionStats = ({
  durationMs,
  tokenUsage,
}: FormatExecutionStatsParams): string => {
  const parts: string[] = [];

  if (durationMs !== null && durationMs !== undefined && durationMs > 0) {
    parts.push(formatDuration(durationMs));
  }

  if (tokenUsage && hasTokenUsage(tokenUsage)) {
    parts.push(`${formatTokens(tokenUsage.input)} in · ${formatTokens(tokenUsage.output)} out`);
  }

  return parts.join(' · ');
};
