import type { PasswordStrengthLevel, PasswordStrengthResult } from './types';

const UPPER = /[A-Z]/;
const LOWER = /[a-z]/;
const DIGIT = /[0-9]/;
const SPECIAL = /[^A-Za-z0-9\s]/;

const countClasses = (params: {
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}): number => {
  let n = 0;
  if (params.hasUppercase) n += 1;
  if (params.hasLowercase) n += 1;
  if (params.hasNumber) n += 1;
  if (params.hasSpecialChar) n += 1;
  return n;
};

const resolveLevel = (params: {
  password: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}): PasswordStrengthLevel => {
  if (params.password.length === 0 || !params.hasMinLength) {
    return 'weak';
  }
  const classes = countClasses({
    hasUppercase: params.hasUppercase,
    hasLowercase: params.hasLowercase,
    hasNumber: params.hasNumber,
    hasSpecialChar: params.hasSpecialChar,
  });
  if (classes === 0) {
    return 'weak';
  }
  if (classes <= 2) {
    return 'fair';
  }
  if (classes === 3) {
    return 'good';
  }
  return 'strong';
};

export const validatePasswordStrength = (password: string): PasswordStrengthResult => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = UPPER.test(password);
  const hasLowercase = LOWER.test(password);
  const hasNumber = DIGIT.test(password);
  const hasSpecialChar = SPECIAL.test(password);

  return {
    level: resolveLevel({
      password,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
    }),
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
};
