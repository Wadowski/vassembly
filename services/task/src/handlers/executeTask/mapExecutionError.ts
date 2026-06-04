import { NotFoundError, TimeoutError, ValidationError } from '@vassembly/errors';

export interface MappedExecutionError {
  errorMessage: string;
  errorCode: string;
}

const isSystemAgentConnectionValidationError = (error: ValidationError): boolean => {
  const nestedCode = (error.error as { code?: string } | undefined)?.code;
  return (
    nestedCode?.startsWith('SYSTEM_AGENT_CONNECTION') === true ||
    error.message.includes('SYSTEM_AGENT_CONNECTION')
  );
};

export const mapExecutionError = (error: unknown): MappedExecutionError => {
  if (error instanceof ValidationError && isSystemAgentConnectionValidationError(error)) {
    return { errorMessage: error.message, errorCode: 'INVALID_CREDENTIAL' };
  }

  if (error instanceof NotFoundError) {
    return { errorMessage: 'Agent unavailable.', errorCode: 'AGENT_UNAVAILABLE' };
  }

  if (error instanceof TimeoutError) {
    return { errorMessage: 'Provider request timed out.', errorCode: 'PROVIDER_TIMEOUT' };
  }

  if (error instanceof Error) {
    return { errorMessage: error.message, errorCode: 'PROVIDER_ERROR' };
  }

  return { errorMessage: 'An unexpected error occurred.', errorCode: 'INTERNAL_ERROR' };
};
