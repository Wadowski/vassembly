'use client';

import { useState } from 'react';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';

import {
  getProgressAgentName,
  getProgressEventStats,
  getProgressOutcomeSummary,
  getProgressRelativeTime,
  getProgressStatusLabel,
} from './getProgressRowDisplay';
import styles from './ActivityProgressEventRow.module.scss';

export interface ActivityProgressEventRowProps {
  item: TaskActivityItemDto;
}

const isFailedProgressEvent = (item: TaskActivityItemDto): boolean =>
  (item.state ?? '').toLowerCase() === 'failed';

export const ActivityProgressEventRow = ({
  item,
}: ActivityProgressEventRowProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const agentName = getProgressAgentName({ item });
  const statusLabel = getProgressStatusLabel({ item });
  const relativeTime = getProgressRelativeTime({ item });
  const eventStats = getProgressEventStats({ item });
  const outcomeSummary = getProgressOutcomeSummary({ item });
  const rowClassName = isExpanded ? `${styles.row} ${styles.rowExpanded}` : styles.row;
  const hasErrorDetails = isFailedProgressEvent(item) && Boolean(item.errorDetails?.message);

  return (
    <div className={rowClassName} data-testid={`activity-progress-event-${item.eventId ?? item.id}`}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={isExpanded}
        onClick={() => {
          setIsExpanded((current) => !current);
        }}
      >
        <Text variant="body2" className={styles.agentName} title={agentName}>
          {agentName}
        </Text>
        <span className={styles.separator} aria-hidden>
          ·
        </span>
        <Text variant="body2" className={styles.status} data-state={item.state ?? 'started'}>
          {statusLabel}
        </Text>
        {relativeTime ? (
          <>
            <span className={styles.separator} aria-hidden>
              ·
            </span>
            <Text variant="body2" className={styles.time}>
              {relativeTime}
            </Text>
          </>
        ) : null}
      </button>
      {hasErrorDetails ? (
        <Text
          variant="caption"
          className={styles.error}
          data-testid={`activity-progress-error-${item.eventId ?? item.id}`}
        >
          {item.errorDetails?.message}
        </Text>
      ) : null}
      {isExpanded ? (
        <div
          className={styles.details}
          data-testid={`activity-progress-details-${item.eventId ?? item.id}`}
        >
          {eventStats ? (
            <Text
              variant="caption"
              className={styles.stats}
              data-testid={`activity-progress-event-stats-${item.eventId ?? item.id}`}
            >
              {eventStats}
            </Text>
          ) : null}
          {item.provider || item.model ? (
            <Text variant="body2" className={styles.meta}>
              {[item.provider, item.model].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          {hasErrorDetails ? (
            <section data-testid={`activity-progress-error-details-${item.eventId ?? item.id}`}>
              <Text variant="label" className={styles.detailLabel}>
                Error details
              </Text>
              <div className={styles.errorBox}>
                <Text variant="body2" className={styles.errorMessage}>
                  {item.errorDetails?.message}
                </Text>
                {item.errorDetails?.type || item.errorDetails?.stackTrace ? (
                  <details className={styles.errorDetails}>
                    {item.errorDetails?.type ? (
                      <summary>Type: {item.errorDetails.type}</summary>
                    ) : (
                      <summary>Stack trace</summary>
                    )}
                    {item.errorDetails?.stackTrace ? (
                      <pre className={styles.stackTrace}>{item.errorDetails.stackTrace}</pre>
                    ) : null}
                  </details>
                ) : null}
              </div>
            </section>
          ) : null}
          {outcomeSummary ? (
            <Text
              variant="body2"
              className={styles.meta}
              data-testid={`activity-progress-outcome-${item.eventId ?? item.id}`}
            >
              {outcomeSummary}
            </Text>
          ) : null}
          {item.inputMessages ? (
            <section>
              <Text variant="label" className={styles.detailLabel}>
                Input
              </Text>
              <pre className={styles.code}>{item.inputMessages}</pre>
            </section>
          ) : null}
          {item.generatedResponse ? (
            <section>
              <Text variant="label" className={styles.detailLabel}>
                Response
              </Text>
              <pre className={styles.code}>{item.generatedResponse}</pre>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
