import type { SystemAgentAdminItem, SystemAgentFormInput } from '@vassembly/ui-api-hooks';

export enum SystemAgentFormMode {
  Create = 'create',
  Edit = 'edit',
}

export interface SystemAgentFormProps {
  mode: SystemAgentFormMode;
  initialAgent?: SystemAgentAdminItem;
  isSubmitting?: boolean;
  nameConflictError?: string;
  onSubmit: (input: SystemAgentFormInput) => Promise<void>;
  onCancel: () => void;
}
