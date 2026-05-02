import { ErrorTypes } from '@vassembly/errors';
import type { CommonError } from '@vassembly/errors';

const SIGN_IN_FAILED = 'Sign-in failed. Check your email and password.';
const UNABLE_CONNECT = 'Unable to connect. Please try again.';
const TIMED_OUT = 'Connection timed out. Please try again.';
const GENERIC = 'An error occurred. Please try again.';

export const formatLoginErrorMessage = (error: CommonError): string => {
  if (error.type === ErrorTypes.TIMEOUT) {
    return TIMED_OUT;
  }

  if (error.statusCode === 0) {
    return UNABLE_CONNECT;
  }

  if (error.type === ErrorTypes.UNAUTHORIZED || error.type === ErrorTypes.NOT_FOUND) {
    return SIGN_IN_FAILED;
  }

  const lowerMessage = error.message.toLowerCase();
  if (lowerMessage.includes('network')) {
    return UNABLE_CONNECT;
  }

  return GENERIC;
};
