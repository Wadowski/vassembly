import { ErrorTypes } from '@vassembly/errors';
import type { CommonError } from '@vassembly/errors';

import {
  RESET_PASSWORD_GENERIC_ERROR_MESSAGE,
  RESET_PASSWORD_INVALID_LINK_MESSAGE,
  RESET_PASSWORD_NETWORK_ERROR_MESSAGE,
} from './constants';

const isInvalidTokenMessage = (message: string): boolean => {
  const m = message.toLowerCase();
  return (
    m.includes('token') ||
    m.includes('expired') ||
    m.includes('invalid') ||
    m.includes('not found')
  );
};

export const formatResetPasswordErrorMessage = (error: CommonError): string => {
  if (error.statusCode === 0) {
    return RESET_PASSWORD_NETWORK_ERROR_MESSAGE;
  }
  if (error.type === ErrorTypes.NOT_FOUND || error.type === ErrorTypes.UNAUTHORIZED) {
    return RESET_PASSWORD_INVALID_LINK_MESSAGE;
  }
  if (error.type === ErrorTypes.WRONG_PARAM && isInvalidTokenMessage(error.message)) {
    return RESET_PASSWORD_INVALID_LINK_MESSAGE;
  }
  if (error.type === ErrorTypes.TIMEOUT) {
    return RESET_PASSWORD_NETWORK_ERROR_MESSAGE;
  }
  const lowerMessage = error.message.toLowerCase();
  if (lowerMessage.includes('network')) {
    return RESET_PASSWORD_NETWORK_ERROR_MESSAGE;
  }
  return RESET_PASSWORD_GENERIC_ERROR_MESSAGE;
};
