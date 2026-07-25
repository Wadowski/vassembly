'use client';

import type { MouseEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { Button } from '@vassembly/ui-system-design/button';
import { Switch } from '@vassembly/ui-system-design/switch';
import { Tag } from '@vassembly/ui-system-design/tag';
import { Text } from '@vassembly/ui-system-design/text';

import { McpStatusBadge } from '../McpStatusBadge/McpStatusBadge';

import styles from './McpListItem.module.scss';
import type { McpListItemProps } from './types';

const DEFAULT_ICON_SIZE = 40;

/**
 * Card displaying MCP summary with optional status badge and enable toggle.
 */
export const McpListItem = ({
  mcp,
  statusBadge,
  iconSize = DEFAULT_ICON_SIZE,
  isToggleLoading = false,
  onToggleEnabled,
}: McpListItemProps): JSX.Element => {
  const resolvedBadge = statusBadge ?? mcp.configurationStatus ?? 'pending';
  const isEnabled = mcp.enabled ?? false;
  const requiresConfiguration = mcp.requiresConfiguration ?? false;
  const canEnable = !requiresConfiguration || resolvedBadge === 'configured';
  const isToggleDisabled = isToggleLoading || (!isEnabled && !canEnable);
  const [enabled, setEnabled] = useState(isEnabled);

  useEffect(() => {
    setEnabled(isEnabled);
  }, [isEnabled]);

  const handleToggle = useCallback(
    (nextEnabled: boolean): void => {
      if (onToggleEnabled === undefined) {
        return;
      }

      const previousEnabled = enabled;
      setEnabled(nextEnabled);

      void onToggleEnabled({ mcpId: mcp.id, enabled: nextEnabled }).then((success) => {
        if (!success) {
          setEnabled(previousEnabled);
        }
      });
    },
    [enabled, mcp.id, onToggleEnabled],
  );

  const handleExternalLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>): void => {
    event.stopPropagation();
  }, []);

  return (
    <div className={styles.card} data-enabled={enabled}>
      <Link href={`/mcps/${mcp.id}`} className={styles.contentLink} aria-label={`Configure ${mcp.name}`}>
        <div className={styles.header}>
          {/* eslint-disable-next-line @next/next/no-img-element -- MCP icons are served from arbitrary external URLs */}
          <img
            className={styles.icon}
            src={mcp.iconPath}
            alt=""
            width={iconSize}
            height={iconSize}
          />
          <div className={styles.titleRow}>
            <Text variant="h3" as="h3" className={styles.name}>
              {mcp.name}
            </Text>
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
      </Link>
      <div className={styles.footer}>
        {requiresConfiguration ? (
          <Button
            as="a"
            variant="text"
            size="small"
            color="secondary"
            text="Configure"
            href={`/mcps/${mcp.id}`}
            aria-label={`Configure ${mcp.name}`}
          />
        ) : null}
        <div className={styles.footerToggle}>
          <Switch
            isChecked={enabled}
            label={enabled ? 'Enabled' : 'Disabled'}
            isDisabled={isToggleDisabled}
            isLoading={isToggleLoading}
            onChange={handleToggle}
          />
        </div>
      </div>
    </div>
  );
};
