import type { AgentDto } from '@vassembly/ui-api-hooks';
import type { AgentFormValues } from '@vassembly/ui-api-hooks';

export enum AgentFormMode {
  Create = 'create',
  Edit = 'edit',
}

export interface AgentFormProps {
  mode: AgentFormMode;
  initialAgent?: AgentDto;
  removedAt?: string | null;
  isSubmitting?: boolean;
  isRestoring?: boolean;
  onSubmit?: (payload: AgentFormValues) => Promise<void> | void;
  onRestore?: () => Promise<void> | void;
}
