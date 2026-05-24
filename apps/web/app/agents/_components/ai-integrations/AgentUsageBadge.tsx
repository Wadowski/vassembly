'use client';

import { Text } from '@vassembly/ui-text';

import styles from './AiIntegrationsList.module.scss';

interface AgentUsageBadgeProps {
  count: number;
}

export function AgentUsageBadge({ count }: AgentUsageBadgeProps): JSX.Element {
  const label = count === 1 ? '1 agent' : `${count} agents`;

  return (
    <Text variant="body2" as="span" className={styles.agentUsageBadge}>
      {label}
    </Text>
  );
}
