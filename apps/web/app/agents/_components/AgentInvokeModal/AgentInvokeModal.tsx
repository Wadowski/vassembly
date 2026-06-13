'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  PROVIDER_LABELS,
  useAiIntegrations,
  useInvokePersonalAgent,
  type AgentDto,
} from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Loader } from '@vassembly/ui-loader';
import { Modal } from '@vassembly/ui-modal';
import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { ConnectionStatusBadge } from '../ai-integrations/_components/AiIntegrationsList/ConnectionStatusBadge';
import { getAgentCategoryLabel } from '../AgentList/tags';
import { getRequestErrorMessage } from '../../getRequestErrorMessage';
import styles from './styles.module.scss';

export interface AgentInvokeModalProps {
  open: boolean;
  agent?: AgentDto;
  onClose: () => void;
}

export function AgentInvokeModal({ open, agent, onClose }: AgentInvokeModalProps): JSX.Element {
  const snackbar = useSnackbar();
  const { data: integrationsData, fetch: fetchIntegrations, isLoading: isIntegrationsLoading } =
    useAiIntegrations();
  const { mutate: invokeAgent, isLoading: isInvoking, error: invokeError } = useInvokePersonalAgent();

  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | undefined>(undefined);
  const [responseText, setResponseText] = useState<string | undefined>(undefined);
  const [blockingError, setBlockingError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setMessage('');
      setMessageError(undefined);
      setResponseText(undefined);
      setBlockingError(undefined);
      return;
    }
    void fetchIntegrations({ status: 'active', size: 100 });
  }, [fetchIntegrations, open]);

  const activeCredentials = useMemo(
    () => (integrationsData?.items ?? []).filter((credential) => credential.status === 'active'),
    [integrationsData?.items],
  );

  const selectedCredential = useMemo(() => {
    const credentialId = agent?.integrationCredentialId;
    if (credentialId === null || credentialId === undefined || credentialId === '') {
      return undefined;
    }
    return activeCredentials.find((credential) => credential.id === credentialId);
  }, [activeCredentials, agent?.integrationCredentialId]);

  useEffect(() => {
    if (!open || isIntegrationsLoading) {
      return;
    }
    if (!agent?.integrationCredentialId) {
      setBlockingError('This agent has no AI integration configured. Edit the agent to add one.');
      return;
    }
    if (selectedCredential === undefined || selectedCredential.connectionStatus !== 'connected') {
      setBlockingError(
        'The agent AI connection is missing or disconnected. Update the agent integration.',
      );
      return;
    }
    setBlockingError(undefined);
  }, [agent?.integrationCredentialId, isIntegrationsLoading, open, selectedCredential]);

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

    const result = await invokeAgent({ id: agent.id, body: { message: trimmedMessage } });
    if (result === undefined) {
      snackbar.show({
        variant: 'error',
        message: getRequestErrorMessage(invokeError, 'Unable to run agent'),
        duration: 5000,
      });
      return;
    }

    setResponseText(result.result.message);
    snackbar.show({ variant: 'success', message: 'Response ready.', duration: 4000 });
  }, [agent, invokeAgent, invokeError, message, snackbar]);

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setMessage(event.target.value);
    if (event.target.value.trim() !== '') {
      setMessageError(undefined);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Run agent">
      <div className={styles.modalStack}>
        {agent ? (
          <div className={styles.summaryStack}>
            <Text variant="h3">{agent.name}</Text>
            <div>
              <Tag variant="default" size="small">
                {getAgentCategoryLabel(agent.category)}
              </Tag>
            </div>
            <Text variant="body2">{agent.description || 'No description provided.'}</Text>
          </div>
        ) : null}
        {blockingError ? <Alert variant="warning" message={blockingError} /> : null}
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
          {isIntegrationsLoading ? (
            <Loader ariaLabel="Loading agent connection" />
          ) : selectedCredential !== undefined ? (
            <div>
              <Text variant="body2">
                {selectedCredential.name} ({PROVIDER_LABELS[selectedCredential.provider]})
              </Text>
              <ConnectionStatusBadge status={selectedCredential.connectionStatus} />
            </div>
          ) : (
            <Text variant="body2">No connection configured.</Text>
          )}
        </div>
        {isInvoking ? <Loader ariaLabel={`Running ${agent?.name ?? 'agent'}`} /> : null}
        {responseText ? (
          <div className={styles.responseRegion} aria-live="polite" aria-atomic="true">
            <Text variant="body1">{responseText}</Text>
          </div>
        ) : null}
        <div className={styles.modalActions}>
          <Button variant="outlined" text="Cancel" onClick={onClose} isDisabled={isInvoking} />
          {responseText ? (
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
