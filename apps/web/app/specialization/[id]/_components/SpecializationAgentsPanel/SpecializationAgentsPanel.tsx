'use client';

import { Text } from '@vassembly/ui-text';

import { SpecializationAgentItem } from './SpecializationAgentItem/SpecializationAgentItem';
import styles from './SpecializationAgentsPanel.module.scss';
import type { SpecializationAgentsPanelProps } from './types';

export const SpecializationAgentsPanel = ({
  agents,
}: SpecializationAgentsPanelProps): JSX.Element => {
  return (
    <section className={styles.panel} aria-label="Linked Agents">
      {agents.length === 0 ? (
        <Text variant="body2">No agents linked yet.</Text>
      ) : (
        <ul className={styles.list}>
          <Text variant="h2">Agents</Text>
          {agents.map((agent) => (
            <li key={agent.id}>
              <SpecializationAgentItem agent={agent} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
