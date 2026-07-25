'use client';

import { Text } from '@vassembly/ui-system-design/text';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

import styles from './ActivityMcpInvocationRow.module.scss';

export interface ActivityMcpInvocationRowProps {
  item: TaskActivityItemDto;
}

const formatDuration = (durationMs?: number | null): string | null => {
  if (durationMs === undefined || durationMs === null) {
    return null;
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
};

const getRowLabel = ({ item }: { item: TaskActivityItemDto }): string => {
  if (item.kind === 'mcpInvocationStarted') {
    return 'MCP tool started';
  }

  if (item.status === 'error') {
    return 'MCP tool failed';
  }

  return 'MCP tool completed';
};

export const ActivityMcpInvocationRow = ({
  item,
}: ActivityMcpInvocationRowProps): JSX.Element => {
  const label = getRowLabel({ item });
  const duration = formatDuration(item.durationMs);
  const mcpLabel = item.mcpName ?? item.mcpId ?? 'MCP';
  const toolLabel = item.toolName ?? 'tool';

  return (
    <li className={styles.row} data-testid={`activity-mcp-event-${item.usageEventId ?? item.id}`}>
      <Text variant="body2" className={styles.label}>
        {label}
      </Text>
      <span className={styles.separator} aria-hidden>
        ·
      </span>
      <Text variant="body2" className={styles.meta}>
        {mcpLabel} / {toolLabel}
      </Text>
      {item.agentName ? (
        <>
          <span className={styles.separator} aria-hidden>
            ·
          </span>
          <Text variant="body2" className={styles.agent}>
            {item.agentName}
          </Text>
        </>
      ) : null}
      {duration ? (
        <>
          <span className={styles.separator} aria-hidden>
            ·
          </span>
          <Text variant="body2" className={styles.duration}>
            {duration}
          </Text>
        </>
      ) : null}
      {item.errorMessage ? (
        <Text variant="caption" className={styles.error}>
          {item.errorMessage}
        </Text>
      ) : null}
    </li>
  );
};
