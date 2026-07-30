'use client';

import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './styles.module.scss';
import { isCredentialEligibleForSystemAgentPreference } from './types';

import type { SystemAgentPreferenceActionProps } from './types';

const INELIGIBLE_HELPER_TEXT = 'Test the connection and ensure it is active first';

export function SystemAgentPreferenceAction({
  credential,
  currentCredentialId,
  isPreferenceLoading,
  savingCredentialId,
  isSaving,
  onSetPreference,
}: SystemAgentPreferenceActionProps): JSX.Element | null {
  if (isPreferenceLoading) {
    return null;
  }

  if (credential.id === currentCredentialId) {
    return null;
  }

  if (credential.status === 'archived' || credential.status === 'disabled') {
    return null;
  }

  const isEligible = isCredentialEligibleForSystemAgentPreference({ credential });
  const isRowSaving = savingCredentialId === credential.id;
  const isAnotherRowSaving = isSaving && savingCredentialId !== null && !isRowSaving;

  return (
    <div className={styles.preferenceAction}>
      <Button
        size="small"
        variant="text"
        text="Set as system connection"
        title={isEligible ? undefined : INELIGIBLE_HELPER_TEXT}
        isDisabled={!isEligible || isAnotherRowSaving}
        isLoading={isRowSaving}
        onClick={() => {
          void onSetPreference(credential.id);
        }}
      />
      {!isEligible ? (
        <Text variant="caption" className={styles.preferenceHelper}>
          {INELIGIBLE_HELPER_TEXT}
        </Text>
      ) : null}
    </div>
  );
}
