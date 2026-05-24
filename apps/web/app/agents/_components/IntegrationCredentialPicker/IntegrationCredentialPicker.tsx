'use client';

import { PROVIDER_LABELS } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Text } from '@vassembly/ui-text';
import { useRouter } from 'next/navigation';

import { AI_INTEGRATIONS_LIST_ANCHOR } from '../../aiIntegrationRoutes';
import styles from './styles.module.scss';
import type { IntegrationCredentialPickerProps } from './types';


export function IntegrationCredentialPicker({
  value,
  onChange,
  credentials,
  isLoading = false,
  errorMessage,
  isDisabled = false,
}: IntegrationCredentialPickerProps): JSX.Element {
  const router = useRouter();

  const options = [
    { value: '', label: 'Select an integration…' },
    ...credentials.map((credential) => ({
      value: credential.id,
      label: `${credential.name} (${PROVIDER_LABELS[credential.provider] ?? credential.provider})`,
    })),
  ];

  return (
    <div className={styles.pickerStack}>
      <Dropdown
        id="agent-integration-credential"
        label="AI integration"
        placeholder="Select an integration…"
        options={options}
        value={value ?? ''}
        isDisabled={isDisabled || isLoading}
        isFullWidth
        onValueChange={(nextValue) => onChange(nextValue === '' ? null : nextValue)}
      />
      {errorMessage !== undefined ? (
        <Text variant="caption" className={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}
      <Button
        size="small"
        variant="outlined"
        text="Manage integrations"
        onClick={() => router.push(AI_INTEGRATIONS_LIST_ANCHOR)}
      />
    </div>
  );
}
