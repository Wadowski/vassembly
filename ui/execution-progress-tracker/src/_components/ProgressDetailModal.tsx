import React, { useEffect, useState } from 'react';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';

import { formatDuration } from '../utils/formatDuration';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { getProgressEventTitle } from '../utils/getProgressEventTitle';
import { getProviderLabel } from '../utils/getProviderLabel';
import { TokenUsageWidget } from './TokenUsageWidget';
import type { ProgressDetailModalProps, ProgressEvent } from '../types';
import styles from './ProgressDetailModal.module.scss';

const getStateLabel = (state: string): string => {
  if (state === 'COMPLETED') {
    return 'Completed';
  }

  if (state === 'FAILED') {
    return 'Failed';
  }

  if (state === 'STARTED') {
    return 'Started';
  }

  return state;
};

const hasIntegrationInfo = (event: ProgressEvent): boolean =>
  Boolean(event.integrationName || event.provider || event.model);

export const ProgressDetailModal: React.FC<ProgressDetailModalProps> = ({ isOpen, event, onClose }) => {
  const [, setRelativeTimeTick] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const intervalId = setInterval(() => {
      setRelativeTimeTick((current) => current + 1);
    }, 30_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen]);

  if (!event) {
    return null;
  }

  const modalTitle = `@${event.agentName}`;
  const showIntegrationSection = hasIntegrationInfo(event);
  const providerLabel = getProviderLabel({ provider: event.provider });
  const stateLabel = getStateLabel(event.state).toLowerCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md">
      <div className={`${styles.modalStack} ${styles.glassmorphic}`} data-testid="progress-detail-modal">
        <header data-testid="progress-modal-header">
          <Text variant="body2" data-testid="agent-name">
            @{event.agentName}
          </Text>
        </header>

        <div className={styles.summaryRow}>
          <Text variant="body2" className={styles.eventTitle}>
            {getProgressEventTitle(event)}
          </Text>
          <Text variant="body2" className={styles.stateLabel} data-testid="status-badge" data-state={stateLabel}>
            {getStateLabel(event.state)}
          </Text>
        </div>

        <section className={styles.section}>
          <Text variant="label" className={styles.sectionLabel}>
            Metadata
          </Text>
          <dl className={styles.metadataList}>
            <div className={styles.metadataRow}>
              <Text variant="body2" as="dt" className={styles.metadataLabel}>
                Timestamp
              </Text>
              <Text
                variant="body2"
                as="dd"
                className={styles.metadataValue}
                data-testid="relative-time"
              >
                started {formatRelativeTime(event.timestamp)}
              </Text>
            </div>
            <div className={styles.metadataRow}>
              <Text variant="body2" as="dt" className={styles.metadataLabel}>
                Duration
              </Text>
              <Text
                variant="body2"
                as="dd"
                className={styles.metadataValue}
                data-testid="duration"
              >
                {formatDuration(event.duration ?? 0)}
              </Text>
            </div>
          </dl>
        </section>

        {showIntegrationSection && (
          <section className={styles.section}>
            <Text variant="label" className={styles.sectionLabel}>
              AI Integration
            </Text>
            <dl className={styles.metadataList}>
              {event.integrationName && (
                <div className={styles.metadataRow}>
                  <Text variant="body2" as="dt" className={styles.metadataLabel}>
                    Name
                  </Text>
                  <Text variant="body2" as="dd" className={styles.metadataValue}>
                    {event.integrationName}
                  </Text>
                </div>
              )}
              {event.provider && (
                <div className={styles.metadataRow}>
                  <Text variant="body2" as="dt" className={styles.metadataLabel}>
                    Provider
                  </Text>
                  <Text variant="body2" as="dd" className={styles.metadataValue}>
                    {providerLabel}
                  </Text>
                </div>
              )}
              {event.model && (
                <div className={styles.metadataRow}>
                  <Text variant="body2" as="dt" className={styles.metadataLabel}>
                    Model
                  </Text>
                  <Text variant="body2" as="dd" className={styles.metadataValue}>
                    {event.model}
                  </Text>
                </div>
              )}
            </dl>
          </section>
        )}

        {event.tokenUsage && (
          <section className={styles.section}>
            <Text variant="label" className={styles.sectionLabel}>
              Token usage
            </Text>
            <TokenUsageWidget tokenUsage={event.tokenUsage} variant="expanded" />
          </section>
        )}

        {event.errorDetails && (
          <section className={styles.section}>
            <Text variant="label" className={styles.sectionLabel}>
              Error details
            </Text>
            <div className={styles.errorBox}>
              <Text variant="body2" className={styles.errorMessage}>
                {event.errorDetails.message}
              </Text>
              <details className={styles.errorDetails}>
                <summary>Type: {event.errorDetails.type}</summary>
                {event.errorDetails.stackTrace && (
                  <pre className={styles.stackTrace}>{event.errorDetails.stackTrace}</pre>
                )}
              </details>
            </div>
          </section>
        )}

        {event.inputMessages && (
          <section className={styles.section} data-testid="request-section">
            <Text variant="label" className={styles.sectionLabel}>
              Input
            </Text>
            <pre className={styles.codeBlock}>
              <code>{event.inputMessages}</code>
            </pre>
          </section>
        )}

        {event.generatedResponse && (
          <section className={styles.section} data-testid="response-section">
            <Text variant="label" className={styles.sectionLabel}>
              Response
            </Text>
            <pre className={styles.codeBlock}>
              <code>{event.generatedResponse}</code>
            </pre>
          </section>
        )}

        <div className={styles.toolbarRow}>
          <Button variant="outlined" text="Close" onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
};
