'use client';

import type { MouseEvent } from 'react';
import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import { McpStatusBadge } from '../McpStatusBadge/McpStatusBadge';

import styles from './McpListItem.module.scss';
import type { McpListItemProps } from './types';

const DEFAULT_ICON_SIZE = 40;

/**
 * Card displaying MCP summary with optional status badge and navigation to detail page.
 */
export const McpListItem = ({
  mcp,
  statusBadge,
  iconSize = DEFAULT_ICON_SIZE,
  isTitleAriaHidden = false,
}: McpListItemProps): JSX.Element => {
  const router = useRouter();
  const resolvedBadge = statusBadge ?? mcp.configurationStatus ?? 'pending';

  const handleNavigate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      router.push(`/mcps/${mcp.id}`);
    },
    [mcp.id, router],
  );

  const handleExternalLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>): void => {
    event.stopPropagation();
  }, []);

  return (
    <a
      href={`/mcps/${mcp.id}`}
      className={styles.card}
      aria-label={`Configure ${mcp.name}`}
      onClick={handleNavigate}
    >
        <div className={styles.header}>
          <img
            className={styles.icon}
            src={mcp.iconPath}
            alt=""
            width={iconSize}
            height={iconSize}
          />
          <div className={styles.titleRow}>
            {isTitleAriaHidden ? null : (
              <Text variant="h3" as="h3" className={styles.name}>
                {mcp.name}
              </Text>
            )}
            <McpStatusBadge variant={resolvedBadge} />
          </div>
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
          {mcp.documentationUrl ? (
            <a
              className={styles.link}
              href={mcp.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalLinkClick}
            >
              Documentation
            </a>
          ) : null}
          {mcp.repositoryUrl ? (
            <a
              className={styles.link}
              href={mcp.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalLinkClick}
            >
              Repository
            </a>
          ) : null}
        </div>
    </a>
  );
};
