'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo } from 'react';

import { useAiIntegrations, useInternalTools, useMcps, useUserConfiguredMcps } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Dropdown } from '@vassembly/ui-system-design/dropdown';
import { Text } from '@vassembly/ui-system-design/text';
import { TextField } from '@vassembly/ui-system-design/text-field';

import { AGENT_CATEGORY_OPTIONS, AGENT_DESCRIPTION_MAX, AGENT_RULE_MAX } from './constants';
import { useAgentForm } from './useAgentForm';
import styles from './styles.module.scss';
import { AgentFormMode, type AgentFormProps } from './types';
import { AGENT_RULE_FIELD_MIN_ROWS } from '../constants';
import { IntegrationCredentialPicker } from '../IntegrationCredentialPicker';
import { InternalToolAssignmentPicker } from '../InternalToolAssignmentPicker';
import { filterEligibleInternalTools } from '../InternalToolAssignmentPicker/filterEligibleInternalTools';
import type { InternalToolItem } from '../InternalToolAssignmentPicker';
import { McpAssignmentPicker } from '../McpAssignmentPicker';
import type { McpAssignmentOption } from '../McpAssignmentPicker';

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
    assignedMcpIds: initialAgent?.assignedMcpIds ?? [],
    assignedToolIds: initialAgent?.assignedToolIds ?? [],
  });

  const { data: integrationsData, fetch: fetchIntegrations, isLoading: isIntegrationsLoading } = useAiIntegrations();
  const { data: configuredMcpsData, loading: isConfiguredMcpsLoading } = useUserConfiguredMcps();
  const { data: allMcpsData } = useMcps();
  const { data: internalToolsData, loading: isInternalToolsLoading } = useInternalTools();

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

  const configuredMcpOptions = useMemo((): McpAssignmentOption[] => {
    const catalogLookup = new Map(allMcpsData?.mcps.map((mcp) => [mcp.id, mcp]));

    const configured = (configuredMcpsData?.mcps ?? [])
      .map((config) => catalogLookup.get(config.mcpId))
      .filter((mcp): mcp is NonNullable<typeof mcp> => mcp !== undefined)
      .map((mcp) => ({
        id: mcp.id,
        name: mcp.name,
        slug: mcp.slug,
      }));

    const configuredIds = new Set(configured.map((mcp) => mcp.id));
    const staleSelections = values.assignedMcpIds
      .filter((mcpId) => !configuredIds.has(mcpId))
      .map((mcpId) => ({
        id: mcpId,
        name: mcpId,
        slug: 'unconfigured',
      }));

    return [...configured, ...staleSelections];
  }, [allMcpsData?.mcps, configuredMcpsData?.mcps, values.assignedMcpIds]);

  const internalToolOptions = useMemo((): InternalToolItem[] => {
    const catalog = internalToolsData ?? [];
    const accessScopesById = new Map(catalog.map((tool) => [tool.id, tool.accessScope]));
    const catalogItems: InternalToolItem[] = catalog.map((tool) => ({
      id: tool.id,
      displayName: tool.displayName,
      description: tool.description,
    }));

    return filterEligibleInternalTools({
      tools: catalogItems,
      agentType: 'personal',
      accessScopesById,
    });
  }, [internalToolsData]);

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
      assignedMcpIds: initialAgent.assignedMcpIds,
      assignedToolIds: initialAgent.assignedToolIds,
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

  const handleAssignedMcpsChange = (nextValue: string[]): void => {
    setField('assignedMcpIds', nextValue);
  };

  const handleAssignedMcpsBlur = (): void => {
    blurField('assignedMcpIds');
  };

  const handleAssignedToolsChange = (nextValue: string[]): void => {
    setField('assignedToolIds', nextValue);
  };

  const handleAssignedToolsBlur = (): void => {
    blurField('assignedToolIds');
  };

  const isSubmitBlocked = archived || isSubmitting || !isValid;
  const categoryMsg = getFieldErrorMessage('category');
  const integrationMsg = getFieldErrorMessage('integrationCredentialId');

  return (
    <form className={styles.formStack} onSubmit={handleSubmit}>
      {archived ? (
        <div className={styles.toolbarRow}>
          <div className={`${styles.formStack} ${styles.stretchField}`}>
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
        label="Category"
        placeholder="Select category"
        options={CATEGORY_OPTIONS}
        value={values.category}
        isDisabled={archived}
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
      <div onBlur={handleAssignedMcpsBlur}>
        <McpAssignmentPicker
          value={values.assignedMcpIds}
          onChange={handleAssignedMcpsChange}
          configuredMcps={configuredMcpOptions}
          isLoading={isConfiguredMcpsLoading}
          isDisabled={archived}
          errorMessage={getFieldErrorMessage('assignedMcpIds')}
        />
      </div>
      <div onBlur={handleAssignedToolsBlur}>
        <InternalToolAssignmentPicker
          value={values.assignedToolIds}
          onChange={handleAssignedToolsChange}
          tools={internalToolOptions}
          isLoading={isInternalToolsLoading}
          isDisabled={archived}
          errorMessage={getFieldErrorMessage('assignedToolIds')}
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
        minRows={AGENT_RULE_FIELD_MIN_ROWS}
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
