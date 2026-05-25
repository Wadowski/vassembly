'use client';

import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';

interface ConnectionStatusBadgeProps {
  status: string;
}

const CONNECTION_VARIANT_MAP: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  connected: 'success',
  failed: 'error',
  untested: 'warning',
};

const CONNECTION_LABEL_MAP: Record<string, string> = {
  connected: 'Connected',
  failed: 'Failed',
  untested: 'Untested',
};

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps): JSX.Element {
  const variant = CONNECTION_VARIANT_MAP[status] ?? 'default';
  const label = CONNECTION_LABEL_MAP[status] ?? status;

  return (
    <Tag size="small" variant={variant} className={styles.connectionBadge}>
      <Text variant="label" as="span">
        {label}
      </Text>
    </Tag>
  );
}
