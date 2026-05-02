import { z } from 'zod';
import { validatorFactory } from '@vassembly/validation';
import type { ValidateRegisterFormParams, ValidateRegisterFormResult } from './types';
import { validatePasswordStrength } from './validatePasswordStrength';

const registerFormSchema = z
  .object({
    email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
    password: z.string().trim().min(1, 'Password is required.'),
    confirmPassword: z.string().trim().min(1, 'Please confirm your password.'),
    firstName: z.string().trim().min(1, 'First name is required.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
  })
  .superRefine((data, ctx) => {
    if (data.password.length > 0 && data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must be at least 8 characters.',
        path: ['password'],
      });
    }
    if (data.password.length >= 8 && validatePasswordStrength(data.password).level !== 'strong') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Password strength is too low. Use uppercase, lowercase, a number, and a special character.',
        path: ['password'],
      });
    }
    if (data.confirmPassword.length > 0 && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords must match.',
        path: ['confirmPassword'],
      });
    }
  });

const validate = validatorFactory(registerFormSchema);

export const validateRegisterForm = (
  params: ValidateRegisterFormParams,
): ValidateRegisterFormResult => {
  const result = validate(params);

  if (result.success) {
    return { isValid: true };
  }

  const firstIssue = result.error.error?.issues?.[0];
  const errorMessage = firstIssue?.message ?? 'Validation failed.';
  return { isValid: false, message: errorMessage };
};
