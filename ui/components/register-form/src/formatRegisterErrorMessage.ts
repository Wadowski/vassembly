import { ErrorTypes } from '@vassembly/errors';
import type { CommonError } from '@vassembly/errors';

const EMAIL_TAKEN = 'This email is already registered.';
const PASSWORD_POLICY = "Password doesn't meet requirements.";
const VALIDATION = 'Please check your information and try again.';
const NETWORK = 'Network error. Please try again.';
const TIMEOUT = 'Request timed out. Please try again.';
const GENERIC = 'Registration failed. Please try again.';

export const formatRegisterErrorMessage = (error: CommonError): string => {
  if (error.type === ErrorTypes.TIMEOUT) {
    return TIMEOUT;
  }

  if (error.statusCode === 0) {
    return NETWORK;
  }

  const lowerMessage = error.message.toLowerCase();

  if (lowerMessage.includes('network')) {
    return NETWORK;
  }

  if (lowerMessage.includes('already exists') || lowerMessage.includes('email exists')) {
    return EMAIL_TAKEN;
  }

  if (
    lowerMessage.includes('password') &&
    (lowerMessage.includes('weak') ||
      lowerMessage.includes('policy') ||
      lowerMessage.includes('does not meet'))
  ) {
    return PASSWORD_POLICY;
  }

  if (
    lowerMessage.includes('validation') ||
    error.type === ErrorTypes.WRONG_PARAM ||
    error.statusCode === 400
  ) {
    return VALIDATION;
  }

  return GENERIC;
};
