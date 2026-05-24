'use client';

import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

import styles from './styles.module.scss';

interface AiIntegrationStatusBadgeProps {
  status: string;
}

const STATUS_VARIANT_MAP: Record<string, 'success' | 'default' | 'warning'> = {
  active: 'success',
  disabled: 'default',
  archived: 'warning',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  active: 'Active',
  disabled: 'Disabled',
  archived: 'Archived',
};

export function AiIntegrationStatusBadge({ status }: AiIntegrationStatusBadgeProps): JSX.Element {
  const variant = STATUS_VARIANT_MAP[status] ?? 'default';
  const label = STATUS_LABEL_MAP[status] ?? status;
  const isArchived = status === 'archived';

  return (
    <Tag size="small" variant={variant} className={isArchived ? styles.archivedStatus : undefined}>
      <Text variant="label" as="span" className={isArchived ? styles.archivedStatusText : undefined}>
        {label}
      </Text>
    </Tag>
  );
}
