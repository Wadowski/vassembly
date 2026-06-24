'use client';

import Link from 'next/link';

import { Text } from '@vassembly/ui-text';

import styles from './SpecializationMcpListItem.module.scss';
import type { SpecializationMcpListItemProps } from './types';

const MCP_ICON_SIZE = 40;

export const SpecializationMcpListItem = ({ mcp }: SpecializationMcpListItemProps): JSX.Element => {
  const hasIcon = mcp.iconPath !== undefined && mcp.iconPath !== '';

  return (
    <Link href={`/mcps/${mcp.id}`} className={styles.card} aria-label={`View ${mcp.name}`}>
      {hasIcon ? (
        // eslint-disable-next-line @next/next/no-img-element -- MCP icons are served from arbitrary external URLs
        <img className={styles.icon} src={mcp.iconPath} alt="" width={MCP_ICON_SIZE} height={MCP_ICON_SIZE} />
      ) : null}
      <div className={styles.content}>
        <Text variant="body1" className={styles.name}>
          {mcp.name}
        </Text>
        <Text variant="caption" className={styles.slug}>
          {mcp.slug}
        </Text>
        {mcp.description !== undefined && mcp.description !== '' ? (
          <Text variant="body2" className={styles.description}>
            {mcp.description}
          </Text>
        ) : null}
      </div>
    </Link>
  );
};
