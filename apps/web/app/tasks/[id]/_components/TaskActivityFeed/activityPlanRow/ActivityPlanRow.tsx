'use client';

import { useMemo, useState } from 'react';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';

import { CommentSkillTags } from '../../../../../_components/CommentSkillTags';
import { ActivityEmphasizedCard } from '../activityEmphasizedCard/ActivityEmphasizedCard';
import cardStyles from '../activityEmphasizedCard/ActivityEmphasizedCard.module.scss';
import { getPlanStatusSummary } from './getPlanStatusSummary';
import { ActivityPlanOrderGroup } from './ActivityPlanOrderGroup/ActivityPlanOrderGroup';
import styles from './ActivityPlanRow.module.scss';

export interface ActivityPlanRowProps {
  item: TaskActivityItemDto;
  isAdmin: boolean;
}

export const ActivityPlanRow = ({ item, isAdmin }: ActivityPlanRowProps): JSX.Element | null => {
  const [isExpanded, setIsExpanded] = useState(true);
  const commentId = item.commentId ?? '';
  const planItems = useMemo(() => item.planItems ?? [], [item.planItems]);
  const statusSummary = getPlanStatusSummary({
    status: item.planInstanceStatus ?? 'pending',
    planItems,
  });

  const groups = useMemo(() => {
    const orderValues = [...new Set(planItems.map((planItem) => planItem.order))].sort(
      (left, right) => left - right,
    );

    return orderValues.map((order) => ({
      order,
      items: planItems.filter((planItem) => planItem.order === order),
    }));
  }, [planItems]);

  if (!commentId || !item.planTemplateShortName) {
    return null;
  }

  return (
    <ActivityEmphasizedCard
      label="Plan"
      variant="agent"
      testId={`activity-plan-${commentId}`}
    >
      <Text variant="body1" className={styles.title}>
        {item.planTemplateShortName}
      </Text>
      <Text
        variant="caption"
        className={cardStyles.stats}
        data-testid={`activity-plan-status-${commentId}`}
      >
        {statusSummary}
      </Text>
      <CommentSkillTags
        skillIds={item.commentSkillIds ?? []}
        isAdmin={isAdmin}
        className={cardStyles.skillTags}
      />
      {isExpanded ? (
        <div className={styles.details} data-testid={`activity-plan-details-${commentId}`}>
          {item.planTemplateDescription ? (
            <Text variant="body2" className={styles.description}>
              {item.planTemplateDescription}
            </Text>
          ) : null}
          {groups.map((group) => (
            <ActivityPlanOrderGroup
              key={`${commentId}-${group.order}`}
              commentId={commentId}
              order={group.order}
              items={group.items}
              isParallel={group.items.length > 1}
            />
          ))}
        </div>
      ) : null}
      <Button
        variant="text"
        color="primary"
        text={isExpanded ? 'Hide plan' : 'Show plan'}
        onClick={() => {
          setIsExpanded((current) => !current);
        }}
        data-testid={`activity-plan-toggle-${commentId}`}
      />
    </ActivityEmphasizedCard>
  );
};
