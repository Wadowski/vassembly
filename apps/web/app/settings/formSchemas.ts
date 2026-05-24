import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

const NAME_FIELD_RULE = z
  .string()
  .trim()
  .min(1, 'Name must be between 1 and 80 characters.')
  .max(80, 'Name must be between 1 and 80 characters.');

export const SETTINGS_PROFILE_NAMES_SCHEMA = z.object({
  firstName: NAME_FIELD_RULE,
  lastName: NAME_FIELD_RULE,
});

export const SETTINGS_PASSWORD_COMPLEXITY_RULE = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(100, 'Password must be at most 100 characters long.')
  .refine((password: string): boolean => /[a-z]/.test(password), {
    message: 'Password must contain at least one lowercase letter.',
  })
  .refine((password: string): boolean => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter.',
  })
  .refine((password: string): boolean => /\d/.test(password), {
    message: 'Password must contain at least one number.',
  })
  .refine(
    (password: string): boolean =>
      /[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|`~]/.test(password),
    {
      message: 'Password must contain at least one special character.',
    },
  );

const SETTINGS_CHANGE_PASSWORD_BASE_SCHEMA = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: SETTINGS_PASSWORD_COMPLEXITY_RULE,
  confirmPassword: z.string().min(1, 'Confirmation is required.'),
});

export const SETTINGS_CHANGE_PASSWORD_FORM_SCHEMA =
  SETTINGS_CHANGE_PASSWORD_BASE_SCHEMA.refine(
    (value) => value.newPassword === value.confirmPassword,
    {
      message: 'Password confirmation must match.',
      path: ['confirmPassword'],
    },
  );

export const SETTINGS_ACCOUNT_DELETE_CONFIRMATION_SCHEMA = z.literal('DELETE');

export const validateSettingsProfileNames = validatorFactory(SETTINGS_PROFILE_NAMES_SCHEMA);

export const validateSettingsChangePasswordForm = validatorFactory(SETTINGS_CHANGE_PASSWORD_FORM_SCHEMA);
