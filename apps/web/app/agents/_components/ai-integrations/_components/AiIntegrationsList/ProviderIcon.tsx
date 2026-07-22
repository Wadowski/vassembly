'use client';

import { PROVIDER_LABELS } from '@vassembly/ui-api-hooks';
import { Tag } from '@vassembly/ui-system-design/tag';

import styles from './styles.module.scss';

interface ProviderIconProps {
  provider: string;
}

export function ProviderIcon({ provider }: ProviderIconProps): JSX.Element {
  const label = PROVIDER_LABELS[provider] ?? provider;

  return (
    <Tag size="small" variant="primary" className={styles.providerTag}>
      {label}
    </Tag>
  );
}
