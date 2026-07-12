import { CommonError } from './Error';

export interface RootCauseDetails {
  message: string;
  stackTrace?: string;
}

const getNestedError = (error: unknown): unknown => {
  if (error instanceof CommonError && error.error !== undefined) {
    return error.error;
  }

  if (error instanceof Error && error.cause !== undefined) {
    return error.cause;
  }

  return undefined;
};

const getRootError = (error: unknown): unknown => {
  const nestedError = getNestedError(error);

  if (nestedError === undefined) {
    return error;
  }

  return getRootError(nestedError);
};

const hasStringMessage = (value: unknown): value is { message: string } =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof (value as { message: unknown }).message === 'string';

const resolveMessageFromError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  if (hasStringMessage(error) && error.message.length > 0) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return fallback;
};

export const resolveRootCause = (error: unknown, fallback = 'Unknown error'): RootCauseDetails => {
  const rootError = getRootError(error);
  const fallbackMessage =
    error instanceof Error
      ? error.message
      : hasStringMessage(error)
        ? error.message
        : fallback;
  const message = resolveMessageFromError(rootError, fallbackMessage);
  const stackTrace =
    rootError instanceof Error && rootError.stack !== undefined
      ? rootError.stack
      : error instanceof Error
        ? error.stack
        : undefined;

  return { message, stackTrace };
};

export const resolveRootCauseMessage = (error: unknown, fallback = 'Unknown error'): string =>
  resolveRootCause(error, fallback).message;
