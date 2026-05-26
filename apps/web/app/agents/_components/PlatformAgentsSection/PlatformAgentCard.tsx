'use client';

import { Button } from '@vassembly/ui-button';
import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import type { SystemAgentAdminItem } from '@vassembly/ui-api-hooks';
import { SystemAgentStatus } from '@vassembly/ui-api-hooks';

import type { PlatformAgentCardProps } from './types';
import styles from './styles.module.scss';
import { getSystemAgentCategoryLabel } from './tags';

export function PlatformAgentCard({
  agent,
  onRun,
  onEdit,
  onArchive,
  onRestore,
  onTestInvoke,
}: PlatformAgentCardProps): JSX.Element {
  const isArchived = agent.status === SystemAgentStatus.Archived;

  return (
    <article className={styles.agentCard}>
      <div className={styles.cardHeader}>
        <Tag variant="primary" size="small">
          Platform Agent
        </Tag>
        <Tag variant={isArchived ? 'warning' : 'success'} size="small">
          {isArchived ? 'Archived' : 'Active'}
        </Tag>
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
          isDisabled={isArchived}
          onClick={() => onRun(agent)}
        />
        <div className={styles.adminActions}>
          <Button variant="outlined" text="Edit" onClick={() => onEdit(agent)} />
          {isArchived ? (
            <Button variant="outlined" text="Restore" onClick={() => onRestore(agent)} />
          ) : (
            <Button variant="outlined" text="Archive" onClick={() => onArchive(agent)} />
          )}
          <Button variant="text" text="Test invoke" onClick={() => onTestInvoke(agent)} />
        </div>
      </div>
    </article>
  );
}
