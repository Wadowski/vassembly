'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  PROVIDER_LABELS,
  useAiIntegrations,
  useSystemAgentPreference,
  useUpsertSystemAgentPreference,
} from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Loader } from '@vassembly/ui-loader';
import { Text } from '@vassembly/ui-text';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { ConnectionStatusBadge } from '../../../agents/_components/ai-integrations/_components/AiIntegrationsList/ConnectionStatusBadge';
import { getSystemAgentErrorMessage } from '../../../agents/_components/PlatformAgentsSection/getSystemAgentErrorMessage';
import styles from '../SettingsSections.module.scss';

export function SystemAgentConnectionPreference(): JSX.Element {
  const snackbar = useSnackbar();
  const { data: preferenceData, fetch: fetchPreference, isLoading: isPreferenceLoading } =
    useSystemAgentPreference();
  const { data: integrationsData, fetch: fetchIntegrations, isLoading: isIntegrationsLoading } =
    useAiIntegrations();
  const { mutate: savePreference, isLoading: isSaving } = useUpsertSystemAgentPreference();

  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [savedCredentialId, setSavedCredentialId] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    void fetchPreference({});
    void fetchIntegrations({ status: 'active', size: 100 });
  }, [fetchIntegrations, fetchPreference]);

  useEffect(() => {
    const preferenceId = preferenceData?.integrationCredentialId ?? '';
    setSelectedCredentialId(preferenceId);
    setSavedCredentialId(preferenceId);
  }, [preferenceData?.integrationCredentialId]);

  const activeCredentials = useMemo(
    () => (integrationsData?.items ?? []).filter((credential) => credential.status === 'active'),
    [integrationsData?.items],
  );

  const dropdownOptions = useMemo(
    () =>
      activeCredentials.map((credential) => ({
        value: credential.id,
        label: `${credential.name} (${PROVIDER_LABELS[credential.provider] ?? credential.provider})`,
      })),
    [activeCredentials],
  );

  const selectedCredential = activeCredentials.find(
    (credential) => credential.id === selectedCredentialId,
  );

  const isLoading = isPreferenceLoading || isIntegrationsLoading;
  const hasChanges = selectedCredentialId !== savedCredentialId;

  const handleSave = useCallback(async (): Promise<void> => {
    if (selectedCredentialId === '') {
      return;
    }
    setSaveState('idle');
    const result = await savePreference({
      body: { integrationCredentialId: selectedCredentialId },
    });
    if (result === undefined) {
      setSaveState('error');
      snackbar.show({
        variant: 'error',
        message: getSystemAgentErrorMessage(undefined, 'Unable to save connection preference'),
        duration: 5000,
      });
      return;
    }
    setSavedCredentialId(selectedCredentialId);
    setSaveState('saved');
    snackbar.show({
      variant: 'success',
      message: 'System agent connection updated.',
      duration: 4000,
    });
  }, [savePreference, selectedCredentialId, snackbar]);

  if (isLoading) {
    return <Loader ariaLabel="Loading AI connections" />;
  }

  if (activeCredentials.length === 0) {
    return (
      <div className={styles.preferenceStack}>
        <Text variant="body2">Create your first AI connection to use system agents.</Text>
        <Link href="/agents/ai-integrations/create">Add AI connection</Link>
      </div>
    );
  }

  return (
    <div className={styles.preferenceStack}>
      <Dropdown
        id="system-agent-connection-preference"
        label="Use for system agents"
        placeholder="Select connection…"
        options={dropdownOptions}
        value={selectedCredentialId}
        isFullWidth
        onValueChange={setSelectedCredentialId}
      />
      <Text variant="body2">Platform agents run using this connection and your API keys.</Text>
      <Text variant="body2">Only one connection is used at a time.</Text>
      {selectedCredential !== undefined ? (
        <div className={styles.toolbarRow}>
          <Text variant="body2">Connection status:</Text>
          <ConnectionStatusBadge status={selectedCredential.connectionStatus} />
        </div>
      ) : null}
      {saveState === 'saved' ? (
        <Alert variant="success" message="Preference saved." />
      ) : null}
      {saveState === 'error' ? (
        <Alert variant="error" message="Unable to save preference. Try again." />
      ) : null}
      <div className={styles.toolbarRow}>
        <Link href="/agents#ai-integrations">Manage all integrations →</Link>
        <Button
          variant="contained"
          text="Save"
          isDisabled={!hasChanges || selectedCredentialId === ''}
          isLoading={isSaving}
          onClick={() => void handleSave()}
        />
      </div>
    </div>
  );
}
