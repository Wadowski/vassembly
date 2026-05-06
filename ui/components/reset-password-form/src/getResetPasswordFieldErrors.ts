import {
  RESET_PASSWORD_CONFIRM_REQUIRED,
  RESET_PASSWORD_FIELD_REQUIRED,
  RESET_PASSWORD_MIN_LENGTH,
  RESET_PASSWORD_MISMATCH,
  RESET_PASSWORD_NEED_LOWERCASE,
  RESET_PASSWORD_NEED_NUMBER,
  RESET_PASSWORD_NEED_UPPERCASE,
} from './constants';

export interface GetResetPasswordPolicyFieldErrorParams {
  password: string;
  treatEmptyAsInvalid: boolean;
}

export const getResetPasswordPolicyFieldError = (
  params: GetResetPasswordPolicyFieldErrorParams,
): string | undefined => {
  const { password, treatEmptyAsInvalid } = params;
  if (password.length === 0) {
    return treatEmptyAsInvalid ? RESET_PASSWORD_FIELD_REQUIRED : undefined;
  }
  if (password.length < 8) {
    return RESET_PASSWORD_MIN_LENGTH;
  }
  if (!/[A-Z]/.test(password)) {
    return RESET_PASSWORD_NEED_UPPERCASE;
  }
  if (!/[a-z]/.test(password)) {
    return RESET_PASSWORD_NEED_LOWERCASE;
  }
  if (!/[0-9]/.test(password)) {
    return RESET_PASSWORD_NEED_NUMBER;
  }
  return undefined;
};

export const getResetPasswordConfirmBlurError = (params: {
  password: string;
  confirmPassword: string;
}): string | undefined => {
  const { password, confirmPassword } = params;
  if (confirmPassword.length === 0) {
    return RESET_PASSWORD_CONFIRM_REQUIRED;
  }
  if (confirmPassword !== password) {
    return RESET_PASSWORD_MISMATCH;
  }
  return undefined;
};
