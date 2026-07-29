'use client';

import { CommentSkillTags } from '../../../../_components/CommentSkillTags';

import styles from './TaskDetailSkillsUsed.module.scss';
import type { TaskDetailSkillsUsedProps } from './types';

export const TaskDetailSkillsUsed = ({
  skillIds,
  isAdmin,
}: TaskDetailSkillsUsedProps): JSX.Element | null => {
  if (skillIds.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Skills used in plan" data-testid="task-detail-skills-used">
      <h2 className={styles.heading}>Skills used</h2>
      <CommentSkillTags skillIds={skillIds} isAdmin={isAdmin} />
    </section>
  );
};
