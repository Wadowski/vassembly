'use client';

import { Button } from '@vassembly/ui-button';
import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import type { SystemAgentCatalogItem } from '@vassembly/ui-api-hooks';
import { SystemAgentStatus } from '@vassembly/ui-api-hooks';

import styles from './styles.module.scss';
import { getSystemAgentCategoryLabel } from './tags';

export interface PlatformAgentCardProps {
  agent: SystemAgentCatalogItem;
  isAdmin?: boolean;
  isInvokeEnabled?: boolean;
  onRun: (agent: SystemAgentCatalogItem) => void;
  onEdit?: (agent: SystemAgentCatalogItem) => void;
  onArchive?: (agent: SystemAgentCatalogItem) => void;
  onRestore?: (agent: SystemAgentCatalogItem) => void;
  onTestInvoke?: (agent: SystemAgentCatalogItem) => void;
}

export function PlatformAgentCard({
  agent,
  isAdmin = false,
  isInvokeEnabled = true,
  onRun,
  onEdit,
  onArchive,
  onRestore,
  onTestInvoke,
}: PlatformAgentCardProps): JSX.Element {
  const isArchived = agent.status === SystemAgentStatus.Archived;
  const runDisabled = !isInvokeEnabled || isArchived;

  return (
    <article className={styles.agentCard}>
      <div className={styles.cardHeader}>
        <Tag variant="primary" size="small">
          Platform Agent
        </Tag>
        {isAdmin ? (
          <Tag variant={isArchived ? 'warning' : 'success'} size="small">
            {isArchived ? 'Archived' : 'Active'}
          </Tag>
        ) : null}
      </div>
      <Text variant="h3" as="h3" className={styles.cardTitle}>
        {agent.name}
      </Text>
      <Tag variant="default" size="small">
        {getSystemAgentCategoryLabel(agent.category)}
      </Tag>
      <Text variant="body2" className={styles.cardDescription}>
        {agent.description ?? 'No description provided.'}
      </Text>
      <div className={styles.cardFooter}>
        <Button
          variant="contained"
          text="Run"
          isDisabled={runDisabled}
          onClick={() => onRun(agent)}
        />
        {isAdmin ? (
          <div className={styles.adminActions}>
            <Button variant="outlined" text="Edit" onClick={() => onEdit?.(agent)} />
            {isArchived ? (
              <Button variant="outlined" text="Restore" onClick={() => onRestore?.(agent)} />
            ) : (
              <Button variant="outlined" text="Archive" onClick={() => onArchive?.(agent)} />
            )}
            <Button variant="text" text="Test invoke" onClick={() => onTestInvoke?.(agent)} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
