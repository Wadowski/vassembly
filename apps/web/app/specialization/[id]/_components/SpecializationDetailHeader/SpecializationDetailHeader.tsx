'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Text } from '@vassembly/ui-system-design/text';

import { formatRelativeTime } from '../../../../tasks/[id]/lib/formatRelativeTime';
import {
  SPECIALIZATION_LIST_PATH,
  SPECIALIZATION_LIST_QUERY_STORAGE_KEY,
} from '../../../constants';
import { formatDisplayName } from '../../../utils/formatDisplayName';

import styles from './SpecializationDetailHeader.module.scss';
import type { SpecializationDetailHeaderProps } from './types';

export const SpecializationDetailHeader = ({
  specialization,
}: SpecializationDetailHeaderProps): JSX.Element => {
  const [backHref, setBackHref] = useState(SPECIALIZATION_LIST_PATH);

  useEffect(() => {
    const storedQuery = sessionStorage.getItem(SPECIALIZATION_LIST_QUERY_STORAGE_KEY);
    if (storedQuery === null || storedQuery === '') {
      setBackHref(SPECIALIZATION_LIST_PATH);
      return;
    }

    setBackHref(`${SPECIALIZATION_LIST_PATH}?${storedQuery}`);
  }, []);

  const displayName = formatDisplayName(specialization.name);

  return (
    <header className={styles.header}>
      <Link href={backHref} className={styles.backLink}>
        Back to Specializations
      </Link>
      <Text variant="h1" as="h1">
        {displayName}
      </Text>
      <Text variant="body2" className={styles.description}>
        {specialization.description}
      </Text>
      <Text variant="caption" className={styles.created}>
        Created {formatRelativeTime(specialization.createdAt)}
      </Text>
    </header>
  );
};
