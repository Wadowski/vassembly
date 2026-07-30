import type { McpUsageHistoryItem } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';

import { formatMcpUsageDuration, formatMcpUsageTimestamp } from './formatMcpUsageHistoryDisplay';
import styles from './styles.module.scss';

export interface McpUsageHistoryTableRowDetailsProps {
  item: McpUsageHistoryItem;
}

export const McpUsageHistoryTableRowDetails = ({
  item,
}: McpUsageHistoryTableRowDetailsProps): JSX.Element => {
  const duration = formatMcpUsageDuration({ durationMs: item.durationMs });

  return (
    <div className={styles.details} data-testid={`mcp-usage-details-${item.id}`}>
      <section>
        <Text variant="label" className={styles.detailLabel}>
          Tool
        </Text>
        <Text variant="body2" className={styles.detailValue}>
          {item.toolName}
        </Text>
        {item.toolDisplayName && item.toolDisplayName !== item.toolName ? (
          <Text variant="caption" className={styles.meta}>
            Display name: {item.toolDisplayName}
          </Text>
        ) : null}
      </section>
      <section>
        <Text variant="label" className={styles.detailLabel}>
          Started at
        </Text>
        <Text variant="body2" className={styles.meta}>
          {formatMcpUsageTimestamp({ timestamp: item.startedAt }) ?? '—'}
        </Text>
      </section>
      <section>
        <Text variant="label" className={styles.detailLabel}>
          Ended at
        </Text>
        <Text variant="body2" className={styles.meta}>
          {formatMcpUsageTimestamp({ timestamp: item.endedAt }) ?? '—'}
          {duration ? ` · ${duration}` : ''}
        </Text>
      </section>
      {item.input ? (
        <section>
          <Text variant="label" className={styles.detailLabel}>
            Input{item.inputTruncated ? ' (truncated)' : ''}
          </Text>
          <pre className={styles.code}>{item.input}</pre>
        </section>
      ) : null}
      {item.output ? (
        <section>
          <Text variant="label" className={styles.detailLabel}>
            Output{item.outputTruncated ? ' (truncated)' : ''}
          </Text>
          <pre className={styles.code}>{item.output}</pre>
        </section>
      ) : null}
      {item.errorMessage ? (
        <section>
          <Text variant="label" className={styles.detailLabel}>
            Error
          </Text>
          <div className={styles.errorBox}>
            <Text variant="body2" className={styles.errorMessage}>
              {item.errorMessage}
            </Text>
          </div>
        </section>
      ) : null}
    </div>
  );
};
