import { z } from 'zod';
import { getValidatorIssues, validatorFactory } from '@vassembly/validation';

import { RESET_PASSWORD_CONFIRM_REQUIRED, RESET_PASSWORD_MISMATCH } from './constants';
import { getResetPasswordPolicyFieldError } from './getResetPasswordFieldErrors';
import type { ValidateResetPasswordFormParams, ValidateResetPasswordFormResult } from './types';

const schema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const policyError = getResetPasswordPolicyFieldError({
      password: data.password.trim(),
      treatEmptyAsInvalid: true,
    });
    if (policyError !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: policyError,
        path: ['password'],
      });
    }
    if (data.confirmPassword.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: RESET_PASSWORD_CONFIRM_REQUIRED,
        path: ['confirmPassword'],
      });
    } else if (
      data.password.trim().length > 0 &&
      data.confirmPassword.trim().length > 0 &&
      data.password.trim() !== data.confirmPassword.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: RESET_PASSWORD_MISMATCH,
        path: ['confirmPassword'],
      });
    }
  });

const validate = validatorFactory(schema);

export const validateResetPasswordForm = (
  params: ValidateResetPasswordFormParams,
): ValidateResetPasswordFormResult => {
  const result = validate({
    password: params.password,
    confirmPassword: params.confirmPassword,
  });
  if (result.success) {
    return { isValid: true };
  }

  const issues = getValidatorIssues(result);
  const passwordIssue = issues.find((issue) => issue.path[0] === 'password');
  const confirmIssue = issues.find((issue) => issue.path[0] === 'confirmPassword');
  return {
    isValid: false,
    passwordError: passwordIssue?.message,
    confirmPasswordError: confirmIssue?.message,
  };
};
