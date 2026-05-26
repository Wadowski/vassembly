'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { SystemAgentFormInput } from '@vassembly/ui-api-hooks';
import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';
import { Text } from '@vassembly/ui-text';
import { Tag } from '@vassembly/ui-tag';

import { SystemAgentFormFields } from './SystemAgentFormFields';
import { useSystemAgentForm } from './useSystemAgentForm';
import { getSystemAgentStatusLabel, getSystemAgentStatusVariant } from './tags';
import { type SystemAgentEditModalProps } from './types';
import styles from './styles.module.scss';

export function SystemAgentEditModal({
  open,
  agent,
  onClose,
  onSubmit,
  isSubmitting = false,
  nameConflictError,
}: SystemAgentEditModalProps): JSX.Element {
  const form = useSystemAgentForm();
  const [localNameError, setLocalNameError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open || agent === undefined) {
      return;
    }
    form.reset({
      name: agent.name,
      category: agent.category ?? '',
      description: agent.description ?? '',
      rule: agent.rule,
    });
    setLocalNameError(undefined);
  }, [agent, form, open]);

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

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit System Agent">
      {agent !== undefined ? (
        <div className={styles.auditFields}>
          <Tag variant={getSystemAgentStatusVariant(agent.status)} size="small">
            {getSystemAgentStatusLabel(agent.status)}
          </Tag>
          <Text variant="body2">Updated {new Date(agent.updatedAt).toLocaleString()}</Text>
          <Text variant="body2">Created {new Date(agent.createdAt).toLocaleString()}</Text>
        </div>
      ) : null}
      <SystemAgentFormFields
        form={form}
        nameErrorOverride={localNameError ?? form.getFieldErrorMessage('name')}
        isDisabled={isSubmitting}
        onSubmit={handleSubmit}
      />
      <div className={styles.modalActions}>
        <Button variant="outlined" text="Cancel" onClick={onClose} isDisabled={isSubmitting} />
        <Button
          variant="contained"
          text="Save changes"
          isDisabled={isSubmitting || !form.isValid}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        />
      </div>
    </Modal>
  );
}
