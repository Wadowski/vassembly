'use client';

import type { MouseEvent } from 'react';
import { useCallback } from 'react';

import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import styles from './McpListItem.module.scss';
import type { McpListItemProps } from './types';

export const McpListItem = ({ mcp }: McpListItemProps): JSX.Element => {
  const handleLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>): void => {
    event.stopPropagation();
  }, []);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <img className={styles.icon} src={mcp.iconPath} alt="" width={40} height={40} />
        <Text variant="h3" as="h2" className={styles.name}>
          {mcp.name}
        </Text>
      </div>
      <Text variant="body2" className={styles.description}>
        {mcp.description}
      </Text>
      <div className={styles.tags}>
        {mcp.tags.map((tag) => (
          <Tag key={tag} size="small" variant="default">
            {tag}
          </Tag>
        ))}
      </div>
      <div className={styles.links}>
        {mcp.documentationUrl !== undefined ? (
          <a
            className={styles.link}
            href={mcp.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
          >
            Documentation
          </a>
        ) : null}
        {mcp.repositoryUrl !== undefined ? (
          <a
            className={styles.link}
            href={mcp.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
          >
            Repository
          </a>
        ) : null}
      </div>
    </article>
  );
};
