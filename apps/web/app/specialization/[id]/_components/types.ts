import type {
  SpecializationDetailItem,
  SpecializationMcpItem,
  SystemAgentStatus,
} from '@vassembly/ui-api-hooks';
import type { CommonError } from '@vassembly/errors';

export interface SpecializationAgentItem {
  id: string;
  name: string;
  status: SystemAgentStatus;
}

export interface UseSpecializationDetailResult {
  specialization: SpecializationDetailItem | null | undefined;
  agents: SpecializationAgentItem[];
  mcps: SpecializationMcpItem[];
  loading: boolean;
  error?: CommonError;
  errorMessage?: string;
  isNotFound: boolean;
  handleRetry: () => void;
}
