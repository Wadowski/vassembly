'use client';

import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import { McpStatusBadge } from '../../_components/McpStatusBadge/McpStatusBadge';

import styles from './McpDetailHeader.module.scss';
import type { McpDetailHeaderProps } from './types';

/**
 * MCP detail page header with metadata, status, tags, and external links.
 */
export const McpDetailHeader = ({ mcp, configuration }: McpDetailHeaderProps): JSX.Element => {
  const isConfigured = configuration !== undefined && configuration !== null || mcp.configurationStatus === 'configured';
  const statusVariant = isConfigured ? 'configured' : 'pending';

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <img className={styles.icon} src={mcp.iconPath} alt={mcp.name} width={48} height={48} />
        <div className={styles.titleContent}>
          <Text variant="h1" as="h1">{mcp.name}</Text>
          <McpStatusBadge variant={statusVariant} />
          <Text variant="body2" className={styles.description}>{mcp.description}</Text>
        </div>
      </div>
      <div className={styles.tags}>
        {mcp?.tags?.map((tag) => (
          <Tag key={tag} size="small" variant="default">{tag}</Tag>
        ))}
      </div>
      <div className={styles.links}>
        {mcp.documentationUrl !== undefined && mcp.documentationUrl !== null ? (
          <a className={styles.link} href={mcp.documentationUrl} target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
        ) : null}
        {mcp.repositoryUrl !== undefined && mcp.repositoryUrl !== null ? (
          <a className={styles.link} href={mcp.repositoryUrl} target="_blank" rel="noopener noreferrer">
            Repository
          </a>
        ) : null}
      </div>
    </header>
  );
};
