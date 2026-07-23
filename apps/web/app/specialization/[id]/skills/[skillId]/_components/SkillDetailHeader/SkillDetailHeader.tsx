'use client';

import Link from 'next/link';

import { Text } from '@vassembly/ui-system-design/text';

import styles from './SkillDetailHeader.module.scss';
import type { SkillDetailHeaderProps } from '../types';

export const SkillDetailHeader = ({
  specializationId,
  specializationName,
  skill,
}: SkillDetailHeaderProps): JSX.Element => {
  const backLabel =
    specializationName !== undefined && specializationName !== ''
      ? `← ${specializationName}`
      : '← Back';

  return (
    <header className={styles.header}>
      <Link href={`/specialization/${specializationId}`} className={styles.backLink}>
        {backLabel}
      </Link>
      <Text variant="h1" as="h1">
        {skill.name}
      </Text>
      <Text variant="body2" className={styles.description}>
        {skill.description}
      </Text>
    </header>
  );
};
