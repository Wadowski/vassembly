'use client';

import type { MouseEvent } from 'react';
import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { Text } from '@vassembly/ui-text';

import { formatRelativeTime } from '../../../../tasks/[id]/lib/formatRelativeTime';
import { SPECIALIZATION_LIST_QUERY_STORAGE_KEY } from '../../../constants';
import { formatDisplayName } from '../../../utils/formatDisplayName';
import { formatAgentMcpCounts } from '../../../utils/formatResourceCounts';
import { truncateText } from '../../../utils/truncateText';
import { DESCRIPTION_PREVIEW_MAX_LENGTH } from '../constants';

import styles from './SpecializationListItem.module.scss';
import type { SpecializationListItemProps } from './types';

export const SpecializationListItem = ({
  specialization,
}: SpecializationListItemProps): JSX.Element => {
  const router = useRouter();
  const displayName = formatDisplayName(specialization.name);
  const agentCount = specialization.agentIds?.length ?? 0;
  const mcpCount = specialization.mcpIds?.length ?? 0;
  const description = truncateText({
    text: specialization.description,
    maxLength: DESCRIPTION_PREVIEW_MAX_LENGTH,
  });

  const handleNavigate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();

      if (typeof window !== 'undefined') {
        const listQuery = window.location.search.slice(1);
        if (listQuery !== '') {
          sessionStorage.setItem(SPECIALIZATION_LIST_QUERY_STORAGE_KEY, listQuery);
        }
      }

      router.push(`/specialization/${specialization.id}`);
    },
    [router, specialization.id],
  );

  return (
    <a
      href={`/specialization/${specialization.id}`}
      className={styles.card}
      aria-label={`View specialization ${displayName}`}
      onClick={handleNavigate}
    >
      <Text variant="h3" as="h3" className={styles.name}>
        {displayName}
      </Text>
      <Text variant="body2" className={styles.description}>
        {description}
      </Text>
      <Text variant="caption" className={styles.metadata}>
        {formatAgentMcpCounts({ agentCount, mcpCount })}
        {' · '}
        Created {formatRelativeTime(specialization.createdAt)}
      </Text>
    </a>
  );
};
