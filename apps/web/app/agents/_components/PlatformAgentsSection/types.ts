import type { FormEvent } from 'react';

import type { SystemAgentFormInput } from '@vassembly/ui-api-hooks';
import { SystemAgentCategory } from '@vassembly/ui-api-hooks';

export interface SystemAgentFormValues {
  name: string;
  category: SystemAgentCategory | '';
  description: string;
  rule: string;
  assignedToolIds: string[];
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

