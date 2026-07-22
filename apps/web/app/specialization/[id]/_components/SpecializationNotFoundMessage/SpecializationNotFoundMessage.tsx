'use client';

import Link from 'next/link';

import { Text } from '@vassembly/ui-system-design/text';

import { SPECIALIZATION_LIST_PATH } from '../../../constants';
import { NOT_FOUND_MESSAGE } from '../constants';
import styles from './SpecializationNotFoundMessage.module.scss';

export const SpecializationNotFoundMessage = (): JSX.Element => {
  return (
    <main className={styles.statePage}>
      <Text variant="h1" as="h1">
        {NOT_FOUND_MESSAGE}
      </Text>
      <Link href={SPECIALIZATION_LIST_PATH} className={styles.backLink}>
        Back to Specializations
      </Link>
    </main>
  );
};
