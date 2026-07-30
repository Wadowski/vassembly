'use client';

import { Tag } from '@vassembly/ui-system-design/tag';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './styles.module.scss';

import type { SystemAgentPreferenceBadgeProps } from './types';

export function SystemAgentPreferenceBadge({
  credentialId,
  currentCredentialId,
}: SystemAgentPreferenceBadgeProps): JSX.Element | null {
  if (currentCredentialId === undefined || credentialId !== currentCredentialId) {
    return null;
  }

  return (
    <Tag size="small" variant="primary" className={styles.preferenceBadge}>
      <Text variant="label" as="span">
        Current connection
      </Text>
    </Tag>
  );
}
