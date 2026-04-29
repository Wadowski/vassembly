import { z } from 'zod';
import { validatorFactory } from '@vassembly/validation';

import type { ValidateForgotPasswordFormParams, ValidateForgotPasswordFormResult } from './types';

const forgotPasswordFormSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
});

const validate = validatorFactory(forgotPasswordFormSchema);

export const validateForgotPasswordForm = (
  params: ValidateForgotPasswordFormParams,
): ValidateForgotPasswordFormResult => {
  const result = validate(params);

  if (result.success) {
    return { isValid: true };
  }

  const firstIssue = result.error.error?.issues?.[0];
  const errorMessage = firstIssue?.message ?? 'Validation failed.';
  return { isValid: false, message: errorMessage };
};
