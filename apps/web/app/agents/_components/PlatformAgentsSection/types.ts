import type { FormEvent } from 'react';

import type { SystemAgentAdminItem, SystemAgentFormInput } from '@vassembly/ui-api-hooks';
import { SystemAgentCategory } from '@vassembly/ui-api-hooks';

export interface SystemAgentFormValues {
  name: string;
  category: SystemAgentCategory | '';
  description: string;
  rule: string;
}

export interface UseSystemAgentFormResult {
  values: SystemAgentFormValues;
  getFieldErrorMessage: (key: keyof SystemAgentFormValues) => string | undefined;
  descriptionCharCount: number;
  ruleCharCount: number;
  isValid: boolean;
  setField: <K extends keyof SystemAgentFormValues>(key: K, value: SystemAgentFormValues[K]) => void;
  blurField: (key: keyof SystemAgentFormValues) => void;
  validate: () => boolean;
  reset: (next?: Partial<SystemAgentFormValues>) => void;
  toSubmitInput: () => SystemAgentFormInput;
}

export interface SystemAgentFormFieldsProps {
  form: UseSystemAgentFormResult;
  nameErrorOverride?: string;
  isDisabled?: boolean;
  onSubmit?: (event: FormEvent) => void;
}

export interface SystemAgentArchiveDialogProps {
  name: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConfirmBusy?: boolean;
}

export interface SystemAgentRestoreDialogProps {
  name: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConfirmBusy?: boolean;
}

export interface SystemAgentEditModalProps {
  open: boolean;
  agent?: SystemAgentAdminItem;
  onClose: () => void;
  onSubmit: (input: SystemAgentFormInput) => Promise<void>;
  isSubmitting?: boolean;
  nameConflictError?: string;
}

export interface PlatformAgentCardProps {
  agent: SystemAgentAdminItem;
  onRun: (agent: SystemAgentAdminItem) => void;
  onEdit: (agent: SystemAgentAdminItem) => void;
  onArchive: (agent: SystemAgentAdminItem) => void;
  onRestore: (agent: SystemAgentAdminItem) => void;
  onTestInvoke: (agent: SystemAgentAdminItem) => void;
}
