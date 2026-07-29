'use client';

import { Loader } from '@vassembly/ui-system-design/loader';
import { Text } from '@vassembly/ui-system-design/text';

import { McpUsageHistoryTable } from './McpUsageHistoryTable';
import styles from './styles.module.scss';
import type { McpUsageHistorySectionProps } from './types';
import { useMcpUsageHistorySection } from './useMcpUsageHistorySection';

export const McpUsageHistorySection = ({
  mcpId,
}: McpUsageHistorySectionProps): JSX.Element => {
  const section = useMcpUsageHistorySection({ mcpId });

  return (
    <section className={styles.section} data-testid="mcp-usage-history-section">
      <Text variant="h2" as="h2">
        Usage history
      </Text>
      {section.loading ? <Loader ariaLabel="Loading MCP usage history" /> : null}
      {section.isEmpty ? (
        <Text variant="body2" className={styles.emptyText}>
          No MCP tool calls recorded yet
        </Text>
      ) : null}
      {!section.loading && section.items.length > 0 ? (
        <McpUsageHistoryTable
          items={section.items}
          currentPage={section.currentPage}
          totalPages={section.totalPages}
          total={section.total}
          rangeStart={section.rangeStart}
          rangeEnd={section.rangeEnd}
          onPageChange={section.handlePageChange}
        />
      ) : null}
    </section>
  );
};
