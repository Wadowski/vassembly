'use client';

import Link from 'next/link';

import { Text } from '@vassembly/ui-text';

import styles from './SpecializationSkillListItem.module.scss';
import type { SpecializationSkillListItemProps } from '../types';

const DESCRIPTION_MAX_LENGTH = 120;

const truncateDescription = (description: string): string => {
  if (description.length <= DESCRIPTION_MAX_LENGTH) {
    return description;
  }

  return `${description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}…`;
};

export const SpecializationSkillListItem = ({
  skill,
  specializationId,
}: SpecializationSkillListItemProps): JSX.Element => {
  const href = `/specialization/${specializationId}/skills/${skill.id}`;

  return (
    <Link href={href} className={styles.row} aria-label={`View skill ${skill.name}`}>
      <div className={styles.content}>
        <Text variant="body1" className={styles.name}>
          {skill.name}
        </Text>
        {skill.description !== '' ? (
          <Text variant="body2" className={styles.description}>
            {truncateDescription(skill.description)}
          </Text>
        ) : null}
      </div>
    </Link>
  );
};
