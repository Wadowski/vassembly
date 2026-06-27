'use client';

import Link from 'next/link';

import { Text } from '@vassembly/ui-text';

import { systemAgentEditPath } from '../../../../../agents/systemAgentRoutes';

import styles from './SpecializationAgentItem.module.scss';
import type { SpecializationAgentItemProps } from './types';

export const SpecializationAgentItem = ({
  agent,
}: SpecializationAgentItemProps): JSX.Element => {
  const description = agent.description ?? '';

  return (
    <Link
      href={systemAgentEditPath(agent.id)}
      className={styles.row}
      aria-label={`View ${agent.name}`}
    >
      <div className={styles.content}>
        <Text variant="body1" className={styles.name}>
          {agent.name}
        </Text>
        {description !== '' ? (
          <Text variant="body2" className={styles.description}>
            {description}
          </Text>
        ) : null}
      </div>
    </Link>
  );
};
