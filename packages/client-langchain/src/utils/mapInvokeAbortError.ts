import { ExecutionPausedError } from '@vassembly/errors';

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  return false;
};

export const mapInvokeAbortError = (error: unknown): never => {
  if (error instanceof ExecutionPausedError) {
    throw error;
  }

  if (isAbortError(error)) {
    throw new ExecutionPausedError();
  }

  throw error;
};
