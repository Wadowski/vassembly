import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { formatRelativeTime } from '@vassembly/ui-execution-progress-tracker';

export interface GetToolInvocationRowDisplayParams {
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

export const getToolInvocationDisplayName = ({ item }: GetToolInvocationRowDisplayParams): string => {
  if (item.kind === 'toolInvocation') {
    return item.internalToolDisplayName ?? item.toolName ?? 'Tool';
  }

  return item.toolDisplayName ?? item.toolName ?? item.mcpName ?? 'Tool';
};

export const getToolInvocationAgentName = ({ item }: GetToolInvocationRowDisplayParams): string => {
  if (item.agentName) {
    return item.agentName;
  }

  return formatAgentId({ agentId: item.agentId });
};

export const getToolInvocationStatusLabel = ({ item }: GetToolInvocationRowDisplayParams): string => {
  const status = (item.status ?? 'in_progress').toLowerCase();

  const labelByStatus: Record<string, string> = {
    in_progress: 'In progress',
    success: 'Completed',
    error: 'Failed',
  };

  return labelByStatus[status] ?? status;
};

export const getToolInvocationRelativeTime = ({ item }: GetToolInvocationRowDisplayParams): string => {
  const timestamp = item.startedAt ?? item.occurredAt;

  if (!timestamp) {
    return '';
  }

  return formatRelativeTime(timestamp);
};

export const formatToolInvocationTimestamp = ({
  timestamp,
}: {
  timestamp: string | null | undefined;
}): string | null => {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp).toLocaleString();
};

export const getToolInvocationSourceLabel = ({ item }: GetToolInvocationRowDisplayParams): string => {
  if (item.kind === 'toolInvocation') {
    return item.internalToolDisplayName ?? item.internalToolId ?? 'Internal tool';
  }

  return item.mcpName ?? item.mcpId ?? 'MCP';
};

export const formatToolInvocationDuration = ({
  durationMs,
}: {
  durationMs?: number | null;
}): string | null => {
  if (durationMs === undefined || durationMs === null) {
    return null;
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
};
