'use client';

import { resolveClassName } from '@vassembly/ui-system-design/utils';

import styles from './McpStatusBadge.module.scss';
import type { McpStatusBadgeProps } from './types';

const VARIANT_LABEL: Record<McpStatusBadgeProps['variant'], string> = {
  configured: 'Configured',
  pending: 'Pending',
};

/**
 * Displays MCP configuration status as a compact badge.
 */
export const McpStatusBadge = ({ variant }: McpStatusBadgeProps): JSX.Element => {
  const label = VARIANT_LABEL[variant];
  const isConfigured = variant === 'configured';

  return (
    <span
      className={resolveClassName(
        styles.badge,
        isConfigured ? styles.statusBadgeConfigured : styles.statusBadgePending,
        isConfigured ? 'statusBadgeConfigured' : 'statusBadgePending',
      )}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
};
