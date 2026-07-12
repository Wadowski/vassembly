import { CommonError, resolveRootCause } from '@vassembly/errors';

export interface InvokeErrorDetails {
  message: string;
  type?: string;
  stackTrace?: string;
}

const hasStringMessage = (value: unknown): value is { message: string } =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof (value as { message: unknown }).message === 'string';

export const resolveInvokeErrorDetails = (error: unknown): InvokeErrorDetails => {
  if (error instanceof CommonError) {
    const rootCause = resolveRootCause(error);

    return {
      message: rootCause.message,
      type: error.type,
      stackTrace: rootCause.stackTrace ?? error.stack,
    };
  }

  if (error instanceof Error) {
    const rootCause = resolveRootCause(error);

    return {
      message: rootCause.message,
      stackTrace: rootCause.stackTrace ?? error.stack,
    };
  }

  if (hasStringMessage(error)) {
    return {
      message: error.message,
    };
  }

  if (typeof error === 'string' && error.length > 0) {
    return {
      message: error,
    };
  }

  return {
    message: 'Unknown error',
  };
};
