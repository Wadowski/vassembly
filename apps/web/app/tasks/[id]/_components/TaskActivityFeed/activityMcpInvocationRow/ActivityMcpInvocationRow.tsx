'use client';

import { useState } from 'react';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { CogIcon } from '@vassembly/ui-system-design/icons';
import { Text } from '@vassembly/ui-system-design/text';

import {
  formatToolInvocationDuration,
  formatToolInvocationTimestamp,
  getToolInvocationAgentName,
  getToolInvocationDisplayName,
  getToolInvocationSourceLabel,
  getToolInvocationStatusLabel,
} from './getToolInvocationRowDisplay';
import styles from './ActivityMcpInvocationRow.module.scss';

export interface ActivityMcpInvocationRowProps {
  item: TaskActivityItemDto;
}

const isFailedToolInvocation = (item: TaskActivityItemDto): boolean =>
  (item.status ?? '').toLowerCase() === 'error';

export const ActivityMcpInvocationRow = ({
  item,
}: ActivityMcpInvocationRowProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toolDisplayName = getToolInvocationDisplayName({ item });
  const agentName = getToolInvocationAgentName({ item });
  const statusLabel = getToolInvocationStatusLabel({ item });
  const sourceLabel = getToolInvocationSourceLabel({ item });
  const duration = formatToolInvocationDuration({ durationMs: item.durationMs });
  const rowClassName = isExpanded ? `${styles.row} ${styles.rowExpanded}` : styles.row;
  const hasError = isFailedToolInvocation(item) && Boolean(item.errorMessage);

  return (
    <div className={rowClassName} data-testid={`activity-tool-event-${item.usageEventId ?? item.id}`}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={isExpanded}
        onClick={() => {
          setIsExpanded((current) => !current);
        }}
      >
        <CogIcon className={styles.toolIcon} aria-hidden />
        <Text variant="body2" className={styles.toolName} title={toolDisplayName}>
          {toolDisplayName}
        </Text>
        <span className={styles.separator} aria-hidden>
          ·
        </span>
        <Text variant="body2" className={styles.status} data-status={item.status ?? 'in_progress'}>
          {statusLabel}
        </Text>
      </button>
      {hasError ? (
        <Text
          variant="caption"
          className={styles.error}
          data-testid={`activity-tool-error-${item.usageEventId ?? item.id}`}
        >
          {item.errorMessage}
        </Text>
      ) : null}
      {isExpanded ? (
        <div
          className={styles.details}
          data-testid={`activity-tool-details-${item.usageEventId ?? item.id}`}
        >
          <section>
            <Text variant="label" className={styles.detailLabel}>
              Started at
            </Text>
            <Text variant="body2" className={styles.meta}>
              {formatToolInvocationTimestamp({ timestamp: item.startedAt }) ?? '—'}
            </Text>
          </section>
          <section>
            <Text variant="label" className={styles.detailLabel}>
              Ended at
            </Text>
            <Text variant="body2" className={styles.meta}>
              {formatToolInvocationTimestamp({ timestamp: item.endedAt }) ?? '—'}
              {duration ? ` · ${duration}` : ''}
            </Text>
          </section>
          <section>
            <Text variant="label" className={styles.detailLabel}>
              Called by
            </Text>
            <Text variant="body2">{agentName}</Text>
          </section>
          <section>
            <Text variant="label" className={styles.detailLabel}>
              Source
            </Text>
            <Text variant="body2" className={styles.meta}>
              {sourceLabel}
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
          {hasError ? (
            <section data-testid={`activity-tool-error-details-${item.usageEventId ?? item.id}`}>
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
      ) : null}
    </div>
  );
};
