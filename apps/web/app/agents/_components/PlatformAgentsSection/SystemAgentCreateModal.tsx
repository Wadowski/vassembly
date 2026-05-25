'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@vassembly/ui-button';
import { Modal } from '@vassembly/ui-modal';

import { SystemAgentFormFields } from './SystemAgentFormFields';
import { useSystemAgentForm } from './useSystemAgentForm';
import styles from './styles.module.scss';

import type { SystemAgentFormInput } from '@vassembly/ui-api-hooks';

export interface SystemAgentCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: SystemAgentFormInput) => Promise<void>;
  isSubmitting?: boolean;
  nameConflictError?: string;
}

export function SystemAgentCreateModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  nameConflictError,
}: SystemAgentCreateModalProps): JSX.Element {
  const form = useSystemAgentForm();
  const [localNameError, setLocalNameError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      form.reset();
      setLocalNameError(undefined);
    }
  }, [open, form]);

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
    <Modal isOpen={open} onClose={onClose} title="Create System Agent">
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
          text="Create System Agent"
          isDisabled={isSubmitting || !form.isValid}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        />
      </div>
    </Modal>
  );
}
