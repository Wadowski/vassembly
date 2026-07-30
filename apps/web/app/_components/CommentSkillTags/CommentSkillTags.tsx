'use client';

import Link from 'next/link';

import { useLinkedSkills } from '@vassembly/ui-api-hooks';
import { Tag } from '@vassembly/ui-system-design/tag';

import styles from './CommentSkillTags.module.scss';
import type { CommentSkillTagsProps } from './types';

export const CommentSkillTags = ({
  skillIds,
  isAdmin,
  size = 'small',
  className,
}: CommentSkillTagsProps): JSX.Element | null => {
  const linked = useLinkedSkills({ ids: skillIds });

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
    <div
      className={[styles.tags, className].filter(Boolean).join(' ')}
      data-testid="activity-comment-skills"
    >
      {linked.skills.map((skill) => {
        const tag = (
          <Tag size={size} variant="default">
            {skill.name}
          </Tag>
        );

        if (isAdmin) {
          return (
            <Link
              key={skill.id}
              href={`/specialization/${skill.specializationId}/skills/${skill.id}`}
              className={styles.tagLink}
              aria-label={`View skill: ${skill.name}`}
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
  );
};
