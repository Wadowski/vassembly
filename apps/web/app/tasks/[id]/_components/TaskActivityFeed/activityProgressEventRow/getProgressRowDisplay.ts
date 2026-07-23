import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { formatRelativeTime } from '@vassembly/ui-execution-progress-tracker';

import { formatExecutionStats } from '../formatExecutionStats';

export interface GetProgressRowDisplayParams {
  item: TaskActivityItemDto;
}

const formatAgentId = ({ agentId }: { agentId: string | null | undefined }): string => {
  if (!agentId) {
    return 'Agent';
  }

  if (agentId.length <= 10) {
    return agentId;
  }

  return `${agentId.slice(0, 8)}…`;
};

export const getProgressAgentName = ({ item }: GetProgressRowDisplayParams): string => {
  if (item.agentName) {
    return item.agentName;
  }

  return formatAgentId({ agentId: item.agentId });
};

export const getProgressStatusLabel = ({ item }: GetProgressRowDisplayParams): string => {
  const state = (item.state ?? 'started').toLowerCase();

  const labelByState: Record<string, string> = {
    started: 'Started',
    completed: 'Completed',
    failed: 'Failed',
    waiting: 'Waiting',
  };

  return labelByState[state] ?? state;
};

export const getProgressRelativeTime = ({ item }: GetProgressRowDisplayParams): string => {
  const timestamp = item.timestamp ?? item.occurredAt;

  if (!timestamp) {
    return '';
  }

  return formatRelativeTime(timestamp);
};

export const getProgressEventStats = ({ item }: GetProgressRowDisplayParams): string => {
  return formatExecutionStats({
    durationMs: item.duration,
    tokenUsage: item.tokenUsage,
  });
};
