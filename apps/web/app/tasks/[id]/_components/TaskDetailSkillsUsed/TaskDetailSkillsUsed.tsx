'use client';

import Link from 'next/link';

import { useLinkedSkills } from '@vassembly/ui-api-hooks';
import { Tag } from '@vassembly/ui-system-design/tag';

import styles from './TaskDetailSkillsUsed.module.scss';
import type { TaskDetailSkillsUsedProps, TaskDetailSkillsUsedViewProps } from './types';

export const TaskDetailSkillsUsedView = ({
  skillIds,
  isAdmin,
  linked,
}: TaskDetailSkillsUsedViewProps): JSX.Element | null => {
  if (skillIds.length === 0) {
    return null;
  }

  if (linked.loading && linked.skills.length === 0) {
    return null;
  }

  if (linked.skills.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Skills used in plan">
      <h2 className={styles.heading}>Skills used</h2>
      <div className={styles.tags}>
        {linked.skills.map((skill) => {
          const tag = (
            <Tag size="small" variant="default">
              {skill.name}
            </Tag>
          );

          if (isAdmin) {
            return (
              <Link
                key={skill.id}
                href={`/specialization/${skill.specializationId}/skills/${skill.id}`}
                className={styles.tagLink}
              >
                {tag}
              </Link>
            );
          }

          return (
            <span key={skill.id} className={styles.tag}>
              {tag}
            </span>
          );
        })}
      </div>
    </section>
  );
};

export const TaskDetailSkillsUsed = ({
  skillIds,
  isAdmin,
}: TaskDetailSkillsUsedProps): JSX.Element | null => {
  const linked = useLinkedSkills({ ids: skillIds });

  return <TaskDetailSkillsUsedView skillIds={skillIds} isAdmin={isAdmin} linked={linked} />;
};
