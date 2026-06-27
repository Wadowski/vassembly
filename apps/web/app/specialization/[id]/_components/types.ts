import type { SpecializationDetailItem } from '@vassembly/ui-api-hooks';
import type { CommonError } from '@vassembly/errors';

export interface UseSpecializationDetailResult {
  specialization: SpecializationDetailItem | null | undefined;
  loading: boolean;
  error?: CommonError;
  errorMessage?: string;
  isNotFound: boolean;
  handleRetry: () => void;
}
