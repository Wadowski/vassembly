'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useInternalTools } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-system-design/button';
import { Tag } from '@vassembly/ui-system-design/tag';
import { Text } from '@vassembly/ui-system-design/text';

import { InternalToolAssignmentPicker } from '../../InternalToolAssignmentPicker';
import { filterEligibleInternalTools } from '../../InternalToolAssignmentPicker/filterEligibleInternalTools';
import type { InternalToolItem } from '../../InternalToolAssignmentPicker';
import { SystemAgentFormFields } from '../SystemAgentFormFields';
import { getSystemAgentStatusLabel, getSystemAgentStatusVariant } from '../tags';
import { useSystemAgentForm } from '../useSystemAgentForm';
import styles from './styles.module.scss';
import { SystemAgentFormMode, type SystemAgentFormProps } from './types';

const SUBMIT_LABEL: Record<SystemAgentFormMode, string> = {
  [SystemAgentFormMode.Create]: 'Create System Agent',
  [SystemAgentFormMode.Edit]: 'Save changes',
};

export function SystemAgentForm({
  mode,
  initialAgent,
  isSubmitting = false,
  nameConflictError,
  onSubmit,
  onCancel,
}: SystemAgentFormProps): JSX.Element {
  const form = useSystemAgentForm();
  const { reset } = form;
  const [localNameError, setLocalNameError] = useState<string | undefined>(undefined);
  const { data: internalToolsData, loading: isInternalToolsLoading } = useInternalTools();

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
      agentType: 'system',
      accessScopesById,
    });
  }, [internalToolsData]);

  useEffect(() => {
    if (mode === SystemAgentFormMode.Create) {
      reset();
      setLocalNameError(undefined);
      return;
    }
    if (initialAgent === undefined) {
      return;
    }
    reset({
      name: initialAgent.name,
      category: initialAgent.category ?? '',
      description: initialAgent.description ?? '',
      rule: initialAgent.rule,
      assignedToolIds: initialAgent.assignedToolIds,
    });
    setLocalNameError(undefined);
  }, [reset, initialAgent, mode]);

  useEffect(() => {
    setLocalNameError(nameConflictError);
  }, [nameConflictError]);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (!form.validate()) {
      return;
    }
    void (async () => {
      try {
        await onSubmit(form.toSubmitInput());
      } catch {
        return;
      }
    })();
  };

  const handleCancel = (): void => {
    onCancel();
  };

  const handleAssignedToolsChange = (nextValue: string[]): void => {
    form.setField('assignedToolIds', nextValue);
  };

  const handleAssignedToolsBlur = (): void => {
    form.blurField('assignedToolIds');
  };

  const submitLabel = SUBMIT_LABEL[mode];
  const nameError = localNameError ?? form.getFieldErrorMessage('name');

  return (
    <div className={styles.formStack}>
      {mode === SystemAgentFormMode.Edit && initialAgent !== undefined ? (
        <div className={styles.auditFields}>
          <Tag variant={getSystemAgentStatusVariant(initialAgent.status)} size="small">
            {getSystemAgentStatusLabel(initialAgent.status)}
          </Tag>
          <Text variant="body2">Updated {new Date(initialAgent.updatedAt).toLocaleString()}</Text>
          <Text variant="body2">Created {new Date(initialAgent.createdAt).toLocaleString()}</Text>
        </div>
      ) : null}
      <SystemAgentFormFields
        form={form}
        nameErrorOverride={nameError}
        isDisabled={isSubmitting}
        onSubmit={handleSubmit}
      />
      <div onBlur={handleAssignedToolsBlur}>
        <InternalToolAssignmentPicker
          value={form.values.assignedToolIds}
          onChange={handleAssignedToolsChange}
          tools={internalToolOptions}
          isLoading={isInternalToolsLoading}
          isDisabled={isSubmitting}
          errorMessage={form.getFieldErrorMessage('assignedToolIds')}
        />
      </div>
      <div className={styles.formActions}>
        <Button variant="outlined" text="Cancel" onClick={handleCancel} isDisabled={isSubmitting} />
        <Button
          variant="contained"
          text={submitLabel}
          isDisabled={isSubmitting || !form.isValid}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}
