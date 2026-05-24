'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo } from 'react';

import { useAiIntegrations } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';

import { AGENT_CATEGORY_OPTIONS, AGENT_DESCRIPTION_MAX, AGENT_RULE_MAX } from './agentFormConstants';
import { useAgentForm } from './_hooks/useAgentForm';
import styles from './AgentForm.module.scss';
import { AgentFormMode, type AgentFormProps } from './AgentForm.types';
import { IntegrationCredentialPicker } from './IntegrationCredentialPicker';

const CATEGORY_OPTIONS = AGENT_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function AgentForm({
  mode,
  initialAgent,
  removedAt,
  isSubmitting = false,
  isRestoring = false,
  onSubmit,
  onRestore,
}: AgentFormProps): JSX.Element {
  const archived = !!removedAt;
  const {
    values,
    getFieldErrorMessage,
    descriptionCharCount,
    ruleCharCount,
    isValid,
    setField,
    blurField,
    validate,
    reset,
  } = useAgentForm({
    name: initialAgent?.name ?? '',
    category: initialAgent?.category ?? '',
    description: initialAgent?.description ?? '',
    rule: initialAgent?.rule ?? '',
    integrationCredentialId: initialAgent?.integrationCredentialId ?? null,
  });

  const { data: integrationsData, fetch: fetchIntegrations, isLoading: isIntegrationsLoading } = useAiIntegrations();

  useEffect(() => {
    void fetchIntegrations({ status: 'active', size: 100 });
  }, [fetchIntegrations]);

  const connectedIntegrations = useMemo(() => {
    const activeConnected = (integrationsData?.items ?? []).filter(
      (credential) => credential.connectionStatus === 'connected' && credential.status === 'active',
    );
    const selectedId = values.integrationCredentialId;
    if (selectedId === null) {
      return activeConnected;
    }
    const isSelectedIncluded = activeConnected.some((credential) => credential.id === selectedId);
    if (isSelectedIncluded) {
      return activeConnected;
    }
    const selectedFromAll = (integrationsData?.items ?? []).find((credential) => credential.id === selectedId);
    if (selectedFromAll === undefined) {
      return activeConnected;
    }
    return [...activeConnected, selectedFromAll];
  }, [integrationsData?.items, values.integrationCredentialId]);

  useEffect(() => {
    if (initialAgent === undefined) {
      return;
    }
    reset({
      name: initialAgent.name,
      category: initialAgent.category,
      description: initialAgent.description,
      rule: initialAgent.rule,
      integrationCredentialId: initialAgent.integrationCredentialId,
    });
  }, [initialAgent, reset]);

  const primaryLabel = mode === AgentFormMode.Create ? 'Create agent' : 'Update agent';

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (archived) {
      return;
    }
    if (!validate()) {
      return;
    }
    void onSubmit?.(values);
  };

  const handleRestore = (): void => {
    void onRestore?.();
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setField('name', event.target.value);
  };

  const handleNameBlur = (): void => {
    blurField('name');
  };

  const handleCategoryChange = (value: string): void => {
    setField('category', value === '' ? '' : (value as typeof values.category));
  };

  const handleCategoryBlur = (): void => {
    blurField('category');
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setField('description', event.target.value);
  };

  const handleDescriptionBlur = (): void => {
    blurField('description');
  };

  const handleRuleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setField('rule', event.target.value);
  };

  const handleRuleBlur = (): void => {
    blurField('rule');
  };

  const handleIntegrationChange = (nextValue: string | null): void => {
    setField('integrationCredentialId', nextValue);
  };

  const handleIntegrationBlur = (): void => {
    blurField('integrationCredentialId');
  };

  const isSubmitBlocked = archived || isSubmitting || !isValid;
  const categoryMsg = getFieldErrorMessage('category');
  const integrationMsg = getFieldErrorMessage('integrationCredentialId');

  return (
    <form className={styles.formStack} onSubmit={handleSubmit}>
      {archived ? (
        <div className={styles.toolbarRow}>
          <div className={styles.formStack}>
            <Alert variant="warning" message="This agent has been deleted. Restore it to make changes." />
            <Button
              variant="contained"
              text="Restore"
              onClick={handleRestore}
              isDisabled={isRestoring}
              isLoading={isRestoring}
            />
          </div>
        </div>
      ) : null}
      <TextField
        label="Name"
        value={values.name}
        errorMessage={getFieldErrorMessage('name')}
        isDisabled={archived}
        isFullWidth
        onChange={handleNameChange}
        onBlur={handleNameBlur}
      />
      <Dropdown
        id="agent-category"
        className={styles.categoryDropdown}
        label="Category"
        placeholder="Select category"
        options={CATEGORY_OPTIONS}
        value={values.category}
        isDisabled={archived}
        isFullWidth
        onValueChange={handleCategoryChange}
        onBlur={handleCategoryBlur}
      />
      {categoryMsg !== undefined ? <Text variant="body2">{categoryMsg}</Text> : null}
      <div onBlur={handleIntegrationBlur}>
        <IntegrationCredentialPicker
          value={values.integrationCredentialId}
          onChange={handleIntegrationChange}
          credentials={connectedIntegrations}
          isLoading={isIntegrationsLoading}
          isDisabled={archived}
          errorMessage={integrationMsg}
        />
      </div>
      <TextField
        label="Description"
        value={values.description}
        errorMessage={getFieldErrorMessage('description')}
        isDisabled={archived}
        isFullWidth
        isMultiline
        onChange={handleDescriptionChange}
        onBlur={handleDescriptionBlur}
      />
      <Text variant="body2">{`${descriptionCharCount}/${AGENT_DESCRIPTION_MAX}`}</Text>
      <TextField
        label="Rule"
        value={values.rule}
        errorMessage={getFieldErrorMessage('rule')}
        isDisabled={archived}
        isFullWidth
        isMultiline
        onChange={handleRuleChange}
        onBlur={handleRuleBlur}
      />
      <Text variant="body2">{`${ruleCharCount}/${AGENT_RULE_MAX}`}</Text>
      <Button
        type="submit"
        text={primaryLabel}
        isDisabled={isSubmitBlocked}
        isLoading={isSubmitting}
      />
    </form>
  );
}
