'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@vassembly/ui-button';
import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';

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
  const [localNameError, setLocalNameError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (mode === SystemAgentFormMode.Create) {
      form.reset();
      setLocalNameError(undefined);
      return;
    }
    if (initialAgent === undefined) {
      return;
    }
    form.reset({
      name: initialAgent.name,
      category: initialAgent.category ?? '',
      description: initialAgent.description ?? '',
      rule: initialAgent.rule,
    });
    setLocalNameError(undefined);
  }, [form, initialAgent, mode]);

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
