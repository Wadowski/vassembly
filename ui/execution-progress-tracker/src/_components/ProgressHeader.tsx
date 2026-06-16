import React from 'react';

import { Text } from '@vassembly/ui-text';

import { formatDuration } from '../utils/formatDuration';
import type { ProgressHeaderProps } from '../types';
import styles from './ProgressHeader.module.scss';

const getStatusLabel = ({
  taskStatus,
  completedAt,
}: {
  taskStatus?: ProgressHeaderProps['taskStatus'];
  completedAt: Date | null;
}): string => {
  if (taskStatus === 'done') {
    return 'Completed';
  }

  if (taskStatus === 'failed') {
    return 'Failed';
  }

  if (taskStatus === 'in-progress') {
    return 'In progress';
  }

  if (taskStatus === 'paused') {
    return 'Paused';
  }

  if (completedAt) {
    return 'Completed';
  }

  return 'In progress';
};

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({ taskProgress, taskStatus }) => {
  const startDate = new Date(taskProgress.startedAt);

  return (
    <div className={styles.progressHeader}>
      <div className={styles.progressHeaderTitleRow}>
        <Text variant="label" className={styles.sectionLabel}>
          Progress
        </Text>
        <Text variant="body2" className={styles.statusLabel}>
          {getStatusLabel({ taskStatus, completedAt: taskProgress.completedAt })}
        </Text>
      </div>

      <dl className={styles.metadataList}>
        <div className={styles.metadataRow}>
          <Text variant="body2" as="dt" className={styles.metadataLabel}>
            Started
          </Text>
          <Text variant="body2" as="dd" className={styles.metadataValue}>
            {startDate.toLocaleString()}
          </Text>
        </div>
        <div className={styles.metadataRow}>
          <Text variant="body2" as="dt" className={styles.metadataLabel}>
            Duration
          </Text>
          <Text variant="body2" as="dd" className={styles.metadataValue}>
            {formatDuration(taskProgress.totalDuration)}
          </Text>
        </div>
        <div className={styles.metadataRow}>
          <Text variant="body2" as="dt" className={styles.metadataLabel}>
            Total tokens
          </Text>
          <Text variant="body2" as="dd" className={styles.metadataValue}>
            {taskProgress.totalTokens.total.toLocaleString()}
          </Text>
        </div>
      </dl>
    </div>
  );
};
