import type { TaskPlanInstanceItem } from '@vassembly/domain-task-plan-instance';

export interface DeriveSkillIdsUsedForCommentParams {
  items: TaskPlanInstanceItem[];
}

export const deriveSkillIdsUsedForComment = ({
  items,
}: DeriveSkillIdsUsedForCommentParams): string[] => {
  const skillIds = items
    .map((item) => item.skillId)
    .filter((skillId): skillId is string => skillId !== null);

  return [...new Set(skillIds)];
};
