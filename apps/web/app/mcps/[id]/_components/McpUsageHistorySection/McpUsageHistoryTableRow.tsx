'use client';

import type { MouseEvent } from 'react';

import Link from 'next/link';

import { ArrowDownIcon } from '@vassembly/ui-system-design/icons';
import { Text } from '@vassembly/ui-system-design/text';

import {
  buildMcpUsageAgentHref,
  buildMcpUsageTaskHref,
  formatMcpUsageStatusLabel,
  getMcpUsageToolDisplayName,
} from './formatMcpUsageHistoryDisplay';
import { McpUsageHistoryTableRowDetails } from './McpUsageHistoryTableRowDetails';
import styles from './styles.module.scss';
import type { McpUsageHistoryTableRowProps } from './types';

const stopRowToggle = (event: MouseEvent<HTMLAnchorElement>): void => {
  event.stopPropagation();
};

export const McpUsageHistoryTableRow = ({
  item,
  isExpanded,
  onToggle,
}: McpUsageHistoryTableRowProps): JSX.Element => {
  const toolName = getMcpUsageToolDisplayName({ item });
  const itemClassName = isExpanded ? `${styles.itemRow} ${styles.itemRowExpanded}` : styles.itemRow;
  const detailsPanelClassName = isExpanded
    ? `${styles.detailsPanel} ${styles.detailsPanelOpen}`
    : styles.detailsPanel;

  return (
    <tr className={itemClassName} data-testid={`mcp-usage-item-${item.id}`}>
      <td colSpan={5} className={styles.itemCell}>
        <div
          className={styles.summaryRow}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={onToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggle();
            }
          }}
        >
          <div className={styles.summaryGrid}>
            <div className={styles.expandCell}>
              <ArrowDownIcon
                className={isExpanded ? `${styles.expandIcon} ${styles.expandIconOpen}` : styles.expandIcon}
                aria-hidden
              />
            </div>
            <div className={styles.toolCell}>
              <Text variant="body2" className={styles.toolName} title={toolName}>
                {toolName}
              </Text>
            </div>
            <div className={styles.statusCell}>
              <Text variant="body2" className={styles.status} data-status={item.status}>
                {formatMcpUsageStatusLabel({ status: item.status })}
              </Text>
            </div>
            <div className={styles.agentCell}>
              {item.agentName ? (
                <Link
                  href={buildMcpUsageAgentHref({ agentId: item.agentId })}
                  className={styles.link}
                  onClick={stopRowToggle}
                >
                  {item.agentName}
                </Link>
              ) : (
                <Text variant="body2" className={styles.mutedText}>
                  —
                </Text>
              )}
            </div>
            <div className={styles.taskCell}>
              {item.taskId && item.taskTitle ? (
                <Link
                  href={buildMcpUsageTaskHref({ taskId: item.taskId })}
                  className={styles.link}
                  onClick={stopRowToggle}
                >
                  {item.taskTitle}
                </Link>
              ) : (
                <Text variant="body2" className={styles.mutedText}>
                  —
                </Text>
              )}
            </div>
          </div>
        </div>
        <div className={detailsPanelClassName} data-testid={`mcp-usage-details-panel-${item.id}`}>
          <div className={styles.detailsPanelInner}>
            <McpUsageHistoryTableRowDetails item={item} />
          </div>
        </div>
      </td>
    </tr>
  );
};
