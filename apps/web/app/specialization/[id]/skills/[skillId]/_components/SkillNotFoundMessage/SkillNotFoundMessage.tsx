'use client';

import Link from 'next/link';

import { Text } from '@vassembly/ui-system-design/text';

import { NOT_FOUND_MESSAGE } from '../constants';
import styles from './SkillNotFoundMessage.module.scss';

export interface SkillNotFoundMessageProps {
  specializationId: string;
}

export const SkillNotFoundMessage = ({
  specializationId,
}: SkillNotFoundMessageProps): JSX.Element => {
  return (
    <main className={styles.statePage} data-testid="skill-not-found">
      <Text variant="h1" as="h1">
        {NOT_FOUND_MESSAGE}
      </Text>
      <Link href={`/specialization/${specializationId}`} className={styles.backLink}>
        Back to specialization
      </Link>
    </main>
  );
};
