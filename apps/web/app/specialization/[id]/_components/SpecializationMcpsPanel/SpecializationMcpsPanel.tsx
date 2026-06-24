'use client';

import { Text } from '@vassembly/ui-text';

import { SpecializationMcpListItem } from './SpecializationMcpListItem/SpecializationMcpListItem';
import styles from './SpecializationMcpsPanel.module.scss';
import type { SpecializationMcpsPanelProps } from './types';

const EMPTY_MESSAGE = 'No MCPs mapped to this specialization yet.';

export const SpecializationMcpsPanel = ({ mcps }: SpecializationMcpsPanelProps): JSX.Element => {
  const hasMcps = mcps.length > 0;

  return (
    <section className={styles.panel} aria-label="Mapped MCPs">
      <Text variant="h2" as="h2">
        Mapped MCPs
      </Text>
      {hasMcps ? (
        <div className={styles.list}>
          {mcps.map((mcp) => (
            <SpecializationMcpListItem key={mcp.id} mcp={mcp} />
          ))}
        </div>
      ) : (
        <Text variant="body2" className={styles.emptyMessage}>
          {EMPTY_MESSAGE}
        </Text>
      )}
    </section>
  );
};
