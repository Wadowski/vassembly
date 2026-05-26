'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  PROVIDER_LABELS,
  useAiIntegrations,
  useInvokeSystemAgent,
  useSystemAgentPreference,
  type SystemAgentAdminItem,
} from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Loader } from '@vassembly/ui-loader';
import { Modal } from '@vassembly/ui-modal';
import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { ConnectionStatusBadge } from '../ai-integrations/_components/AiIntegrationsList/ConnectionStatusBadge';
import { getSystemAgentCategoryLabel } from '../PlatformAgentsSection/tags';
import { getSystemAgentErrorMessage } from '../PlatformAgentsSection/getSystemAgentErrorMessage';
import styles from './styles.module.scss';

export interface SystemAgentInvokeModalProps {
  open: boolean;
  agent?: SystemAgentAdminItem;
  onClose: () => void;
}

export function SystemAgentInvokeModal({
  open,
  agent,
  onClose,
}: SystemAgentInvokeModalProps): JSX.Element {
  const snackbar = useSnackbar();
  const { data: preferenceData, fetch: fetchPreference, isLoading: isPreferenceLoading } =
    useSystemAgentPreference();
  const { data: integrationsData, fetch: fetchIntegrations, isLoading: isIntegrationsLoading } =
    useAiIntegrations();
  const { mutate: invokeAgent, isLoading: isInvoking, error: invokeError } = useInvokeSystemAgent();

  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | undefined>(undefined);
  const [connectionOverrideId, setConnectionOverrideId] = useState('');
  const [responseText, setResponseText] = useState<string | undefined>(undefined);
  const [usageSummary, setUsageSummary] = useState<string | undefined>(undefined);
  const [blockingError, setBlockingError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setMessage('');
      setMessageError(undefined);
      setConnectionOverrideId('');
      setResponseText(undefined);
      setUsageSummary(undefined);
      setBlockingError(undefined);
      return;
    }
    void fetchPreference({});
    void fetchIntegrations({ status: 'active', size: 100 });
  }, [fetchIntegrations, fetchPreference, open]);

  const activeCredentials = useMemo(
    () => (integrationsData?.items ?? []).filter((credential) => credential.status === 'active'),
    [integrationsData?.items],
  );

  const selectedCredential = useMemo(() => {
    const preferenceId = preferenceData?.integrationCredentialId;
    if (preferenceId === undefined) {
      return undefined;
    }
    return activeCredentials.find((credential) => credential.id === preferenceId);
  }, [activeCredentials, preferenceData?.integrationCredentialId]);

  useEffect(() => {
    if (!open || isPreferenceLoading) {
      return;
    }
    if (preferenceData === undefined) {
      setBlockingError(
        'Please select an AI connection for system agents in Settings before invoking.',
      );
      return;
    }
    if (selectedCredential === undefined || selectedCredential.connectionStatus !== 'connected') {
      setBlockingError(
        'Your system agent connection is no longer valid. Please select a new one in Settings.',
      );
      return;
    }
    setBlockingError(undefined);
  }, [isPreferenceLoading, open, preferenceData, selectedCredential]);

  const overrideOptions = useMemo(
    () =>
      activeCredentials.map((credential) => ({
        value: credential.id,
        label: `${credential.name} (${PROVIDER_LABELS[credential.provider] ?? credential.provider})`,
      })),
    [activeCredentials],
  );

  const handleRun = useCallback(async (): Promise<void> => {
    if (agent === undefined) {
      return;
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage === '') {
      setMessageError('Message is required.');
      return;
    }
    setMessageError(undefined);
    setResponseText(undefined);
    setUsageSummary(undefined);

    const body = {
      message: trimmedMessage,
      ...(connectionOverrideId !== ''
        ? { connectionOverride: { integrationCredentialId: connectionOverrideId } }
        : {}),
    };

    const result = await invokeAgent({ id: agent.id, body });
    if (result === undefined) {
      snackbar.show({
        variant: 'error',
        message: getSystemAgentErrorMessage(invokeError, 'Unable to run platform agent'),
        duration: 5000,
      });
      return;
    }

    setResponseText(result.result.message);
    if (result.result.usage !== undefined) {
      const usage = result.result.usage;
      const modelLabel = result.result.metadata?.model ?? 'unknown model';
      setUsageSummary(
        `Usage: ${usage.promptTokens} prompt · ${usage.completionTokens} completion tokens · ${modelLabel}`,
      );
    }
    snackbar.show({ variant: 'success', message: 'Response ready.', duration: 4000 });
  }, [agent, connectionOverrideId, invokeAgent, invokeError, message, snackbar]);

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setMessage(event.target.value);
    if (event.target.value.trim() !== '') {
      setMessageError(undefined);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Run platform agent">
      <div className={styles.modalStack}>
        {agent !== undefined ? (
          <div className={styles.summaryStack}>
            <Text variant="h3">{agent.name}</Text>
            <div>
              <Tag variant="primary" size="small">
                Platform Agent
              </Tag>{' '}
              <Tag variant="default" size="small">
                {getSystemAgentCategoryLabel(agent.category)}
              </Tag>
            </div>
            <Text variant="body2">{agent.description ?? 'No description provided.'}</Text>
          </div>
        ) : null}
        {blockingError !== undefined ? <Alert variant="warning" message={blockingError} /> : null}
        <TextField
          label="Your message"
          value={message}
          errorMessage={messageError}
          isDisabled={isInvoking}
          isFullWidth
          isMultiline
          aria-invalid={messageError !== undefined}
          onChange={handleMessageChange}
        />
        <div className={styles.connectionRow}>
          <Text variant="body2">Connection</Text>
          {isPreferenceLoading || isIntegrationsLoading ? (
            <Loader ariaLabel="Loading connection preference" />
          ) : selectedCredential !== undefined ? (
            <div>
              <Text variant="body2">
                {selectedCredential.name} ({PROVIDER_LABELS[selectedCredential.provider]})
              </Text>
              <ConnectionStatusBadge status={selectedCredential.connectionStatus} />
            </div>
          ) : (
            <Text variant="body2">No connection selected.</Text>
          )}
        </div>
        <Dropdown
          id="system-agent-debug-connection"
          label="Debug connection override"
          placeholder="Select credential…"
          options={overrideOptions}
          value={connectionOverrideId}
          isFullWidth
          onValueChange={setConnectionOverrideId}
        />
        {isInvoking ? <Loader ariaLabel={`Running ${agent?.name ?? 'platform agent'}`} /> : null}
        {responseText !== undefined ? (
          <div className={styles.responseRegion} aria-live="polite" aria-atomic="true">
            <Text variant="body1">{responseText}</Text>
            {usageSummary !== undefined ? <Text variant="body2">{usageSummary}</Text> : null}
          </div>
        ) : null}
        <div className={styles.modalActions}>
          <Button variant="outlined" text="Cancel" onClick={onClose} isDisabled={isInvoking} />
          {responseText !== undefined ? (
            <Button variant="text" text="Run again" onClick={() => void handleRun()} isDisabled={isInvoking} />
          ) : null}
          <Button
            variant="contained"
            text="Run"
            isDisabled={isInvoking || blockingError !== undefined}
            isLoading={isInvoking}
            onClick={() => void handleRun()}
          />
        </div>
      </div>
    </Modal>
  );
}
