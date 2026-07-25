'use client';

import { useState } from 'react';

import type { McpUsageHistoryItem } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './styles.module.scss';

export interface McpUsageHistoryItemProps {
  item: McpUsageHistoryItem;
}

const formatDuration = (durationMs: number | null): string | null => {
  if (durationMs === null) {
    return null;
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
};

const formatStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    in_progress: 'In progress',
    success: 'Success',
    error: 'Error',
  };

  return statusLabels[status] ?? status;
};

export const McpUsageHistoryItemRow = ({ item }: McpUsageHistoryItemProps): JSX.Element => {
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const duration = formatDuration(item.durationMs);
  const contextLabel = [item.agentName, item.taskTitle].filter(Boolean).join(' · ');

  return (
    <article className={styles.item} data-testid={`mcp-usage-item-${item.id}`}>
      <div className={styles.header}>
        <Text variant="body2" className={styles.toolName}>
          {item.toolName}
        </Text>
        <Text variant="caption" className={styles.status} data-status={item.status}>
          {formatStatusLabel(item.status)}
        </Text>
      </div>
      {contextLabel ? (
        <Text variant="caption" className={styles.context}>
          {contextLabel}
        </Text>
      ) : null}
      <Text variant="caption" className={styles.timestamps}>
        Started {new Date(item.startedAt).toLocaleString()}
        {item.endedAt ? ` · Ended ${new Date(item.endedAt).toLocaleString()}` : ''}
        {duration ? ` · ${duration}` : ''}
      </Text>
      {item.errorMessage ? (
        <Text variant="caption" className={styles.error}>
          {item.errorMessage}
        </Text>
      ) : null}
      {item.input ? (
        <div className={styles.inputSection}>
          <button
            type="button"
            className={styles.inputToggle}
            onClick={() => {
              setIsInputExpanded((current) => !current);
            }}
          >
            {isInputExpanded ? 'Hide input' : 'Show input'}
            {item.inputTruncated ? ' (truncated)' : ''}
          </button>
          {isInputExpanded ? <pre className={styles.input}>{item.input}</pre> : null}
        </div>
      ) : null}
    </article>
  );
};
