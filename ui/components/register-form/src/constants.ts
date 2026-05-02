import type { PasswordStrengthLevel } from './types';

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrengthLevel, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

export const PASSWORD_REQUIREMENT_LABELS = {
  hasMinLength: 'Minimum 8 characters',
  hasUppercase: 'Uppercase letter (A-Z)',
  hasLowercase: 'Lowercase letter (a-z)',
  hasNumber: 'Number (0-9)',
  hasSpecialChar: 'Special character (!@#$%^&*)',
} as const;
