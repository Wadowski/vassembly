'use client';

import { Loader } from '@vassembly/ui-system-design/loader';
import { Text } from '@vassembly/ui-system-design/text';
import { useMcpUsageHistory } from '@vassembly/ui-api-hooks';

import { McpUsageHistoryItemRow } from './McpUsageHistoryItemRow';
import styles from './styles.module.scss';
import type { McpUsageHistorySectionProps } from './types';

export const McpUsageHistorySection = ({
  mcpId,
}: McpUsageHistorySectionProps): JSX.Element => {
  const { items, loading } = useMcpUsageHistory({ mcpId });

  return (
    <section className={styles.section} data-testid="mcp-usage-history-section">
      <Text variant="h2" as="h2">
        Usage history
      </Text>
      {loading ? <Loader ariaLabel="Loading MCP usage history" /> : null}
      {!loading && items.length === 0 ? (
        <Text variant="body2" className={styles.emptyText}>
          No MCP tool calls recorded yet
        </Text>
      ) : null}
      {!loading && items.length > 0 ? (
        <div className={styles.list}>
          {items.map((item) => (
            <McpUsageHistoryItemRow key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
};
