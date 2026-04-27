import { z } from 'zod';
import { validatorFactory } from '@vassembly/validation';

import type { ValidateLoginFormParams, ValidateLoginFormResult } from './types';

const loginFormSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().trim().min(1, 'Password is required.'),
});

const validate = validatorFactory(loginFormSchema);

export const validateLoginForm = (params: ValidateLoginFormParams): ValidateLoginFormResult => {
  const result = validate(params);

  if (result.success) {
    return { isValid: true };
  }

  const firstIssue = result.error.error?.issues?.[0];
  const errorMessage = firstIssue?.message ?? 'Validation failed.';
  return { isValid: false, message: errorMessage };
};
