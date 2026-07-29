'use client';

import { useCallback, useEffect, useState } from 'react';

import { Pagination } from '@vassembly/ui-system-design/pagination';
import { Text } from '@vassembly/ui-system-design/text';

import { McpUsageHistoryTableRow } from './McpUsageHistoryTableRow';
import styles from './styles.module.scss';
import type { McpUsageHistoryTableProps } from './types';

export const McpUsageHistoryTable = ({
  items,
  currentPage,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  onPageChange,
}: McpUsageHistoryTableProps): JSX.Element => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedItemId(null);
  }, [items, currentPage]);

  const handleToggle = useCallback((itemId: string): void => {
    setExpandedItemId((current) => (current === itemId ? null : itemId));
  }, []);

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <colgroup>
            <col className={styles.expandCol} />
            <col className={styles.toolCol} />
            <col className={styles.statusCol} />
            <col className={styles.agentCol} />
            <col className={styles.taskCol} />
          </colgroup>
          <thead>
            <tr>
              <th className={styles.expandHeader} aria-label="Expand row" />
              <th>
                <Text variant="label" as="span">
                  Tool
                </Text>
              </th>
              <th>
                <Text variant="label" as="span">
                  Status
                </Text>
              </th>
              <th>
                <Text variant="label" as="span">
                  Agent
                </Text>
              </th>
              <th>
                <Text variant="label" as="span">
                  Task
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <McpUsageHistoryTableRow
                key={item.id}
                item={item}
                isExpanded={expandedItemId === item.id}
                onToggle={() => {
                  handleToggle(item.id);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 ? (
        <div className={styles.footer}>
          <Text variant="body2" className={styles.countText}>
            Showing {rangeStart}–{rangeEnd} of {total} total
          </Text>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            ariaLabel="MCP usage history pagination"
          />
        </div>
      ) : null}
    </div>
  );
};
