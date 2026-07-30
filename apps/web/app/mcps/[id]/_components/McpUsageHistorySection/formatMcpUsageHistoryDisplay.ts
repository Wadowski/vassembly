import type { McpUsageHistoryItem } from '@vassembly/ui-api-hooks';

export const buildMcpUsageAgentHref = ({ agentId }: { agentId: string }): string =>
  `/agents/${agentId}/edit`;

export const buildMcpUsageTaskHref = ({ taskId }: { taskId: string }): string =>
  `/tasks/${taskId}`;

export const formatMcpUsageStatusLabel = ({ status }: { status: string }): string => {
  const statusLabels: Record<string, string> = {
    in_progress: 'In progress',
    success: 'Success',
    error: 'Error',
  };

  return statusLabels[status] ?? status;
};

export const formatMcpUsageDuration = ({
  durationMs,
}: {
  durationMs: number | null;
}): string | null => {
  if (durationMs === null) {
    return null;
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
};

export const formatMcpUsageTimestamp = ({
  timestamp,
}: {
  timestamp: string | null;
}): string | null => {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp).toLocaleString();
};

export const getMcpUsageToolDisplayName = ({ item }: { item: McpUsageHistoryItem }): string =>
  item.toolDisplayName ?? item.toolName;
