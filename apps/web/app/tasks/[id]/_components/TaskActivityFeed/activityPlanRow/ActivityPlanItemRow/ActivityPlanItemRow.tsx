'use client';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';

import { getPlanItemStatusDisplay } from '../getPlanItemStatusDisplay';
import styles from './ActivityPlanItemRow.module.scss';

export interface ActivityPlanItemRowProps {
  commentId: string;
  item: NonNullable<TaskActivityItemDto['planItems']>[number];
}

export const ActivityPlanItemRow = ({
  commentId,
  item,
}: ActivityPlanItemRowProps): JSX.Element => {
  const statusDisplay = getPlanItemStatusDisplay({ status: item.status });
  const agentLabel = item.agentName ?? item.agentId;
  const skillLabel = item.skillName ?? 'No skill';

  return (
    <article
      className={styles.card}
      data-testid={`activity-plan-item-${commentId}-${item.templateItemIndex}`}
    >
      <div className={styles.header}>
        <Text variant="body2" className={styles.description}>
          {item.description}
        </Text>
        <Text variant="caption" className={styles[statusDisplay.colorClass]}>
          {statusDisplay.label}
        </Text>
      </div>
      <Text variant="caption" className={styles.meta}>
        {agentLabel} · {skillLabel}
      </Text>
      {item.errorMessage ? (
        <Text
          variant="caption"
          className={styles.error}
          data-testid={`activity-plan-item-error-${commentId}-${item.templateItemIndex}`}
        >
          {item.errorMessage}
        </Text>
      ) : null}
      {item.retryCount > 0 ? (
        <Text variant="caption" className={styles.retry}>
          {item.retryCount === 1 ? 'Retried once' : `Retried ${item.retryCount} times`}
        </Text>
      ) : null}
    </article>
  );
};
