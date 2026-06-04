export interface FormatExecutionDurationMsParams {
  startedAt: string | null;
  endedAt: string | null;
}

export const formatExecutionDurationMs = ({
  startedAt,
  endedAt,
}: FormatExecutionDurationMsParams): number => {
  if (!startedAt || !endedAt) {
    return 0;
  }

  return new Date(endedAt).getTime() - new Date(startedAt).getTime();
};
