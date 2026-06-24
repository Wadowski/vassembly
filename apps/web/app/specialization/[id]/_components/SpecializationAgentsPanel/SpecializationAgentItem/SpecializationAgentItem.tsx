'use client';

import Link from 'next/link';

import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import {
  getSystemAgentStatusLabel,
  getSystemAgentStatusVariant,
} from '../../../../../agents/_components/PlatformAgentsSection/tags';
import { systemAgentEditPath } from '../../../../../agents/systemAgentRoutes';

import styles from './SpecializationAgentItem.module.scss';
import type { SpecializationAgentItemProps } from './types';

export const SpecializationAgentItem = ({
  agent,
}: SpecializationAgentItemProps): JSX.Element => {
  return (
    <Link
      href={systemAgentEditPath(agent.id)}
      className={styles.item}
      aria-label={`View ${agent.name}`}
    >
      <Text variant="body1" className={styles.agentName}>
        {agent.name}
      </Text>
      <Tag size="small" variant={getSystemAgentStatusVariant(agent.status)}>
        {getSystemAgentStatusLabel(agent.status)}
      </Tag>
    </Link>
  );
};
