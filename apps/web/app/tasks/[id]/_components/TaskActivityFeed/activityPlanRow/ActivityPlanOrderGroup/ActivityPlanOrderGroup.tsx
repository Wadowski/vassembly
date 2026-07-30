'use client';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';

import { ActivityPlanItemRow } from '../ActivityPlanItemRow/ActivityPlanItemRow';
import styles from './ActivityPlanOrderGroup.module.scss';

export interface ActivityPlanOrderGroupProps {
  commentId: string;
  order: number;
  items: NonNullable<TaskActivityItemDto['planItems']>;
  isParallel: boolean;
}

export const ActivityPlanOrderGroup = ({
  commentId,
  order,
  items,
  isParallel,
}: ActivityPlanOrderGroupProps): JSX.Element => {
  return (
    <section
      className={styles.group}
      data-testid={`activity-plan-step-${commentId}-${order}`}
    >
      <Text variant="label" className={styles.label}>
        Step {order}
        {isParallel ? ' (parallel)' : ''}
      </Text>
      <div className={styles.items}>
        {items.map((item) => (
          <ActivityPlanItemRow
            key={`${commentId}-${item.templateItemIndex}`}
            commentId={commentId}
            item={item}
          />
        ))}
      </div>
    </section>
  );
};
