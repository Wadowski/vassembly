import { ErrorTypes } from '@vassembly/errors';
import type { CommonError } from '@vassembly/errors';

const UNABLE_CONNECT = 'Unable to connect. Please try again.';
const TIMED_OUT = 'Connection timed out. Please try again.';
const GENERIC = 'We could not complete your request. Please try again.';

export const formatForgotPasswordErrorMessage = (error: CommonError): string => {
  if (error.type === ErrorTypes.TIMEOUT) {
    return TIMED_OUT;
  }

  if (error.statusCode === 0) {
    return UNABLE_CONNECT;
  }

  const lowerMessage = error.message.toLowerCase();
  if (lowerMessage.includes('network')) {
    return UNABLE_CONNECT;
  }

  if (error.type === ErrorTypes.UNAUTHORIZED || error.type === ErrorTypes.NOT_FOUND) {
    return GENERIC;
  }

  if (error.statusCode >= 400 && error.statusCode < 500) {
    return GENERIC;
  }

  if (error.statusCode >= 500) {
    return GENERIC;
  }

  return GENERIC;
};
