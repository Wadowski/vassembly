import type { FormEvent } from 'react';
import type { AuthUser } from '@vassembly/ui-user-auth';

export type RegisterFormSubmitResult = {
  authToken: string;
  refreshToken: string;
  user: AuthUser;
  requiresEmailVerification?: boolean;
};

export type RegisterNavigateFn = (href: string) => void;

export type RegisterCompletionUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type RegisterCompletionResponse = {
  authToken: string;
  refreshToken: string;
  user: RegisterCompletionUser;
  requiresEmailVerification?: boolean;
};

export interface RegisterFormProps {
  titleId?: string;
  className?: string;
  submitLabel?: string;
  returnUrl?: string | null;
  fallbackPath?: string;
  verificationPendingPath?: string;
  onRedirect?: RegisterNavigateFn;
  onSuccess?: (result: RegisterFormSubmitResult) => void;
}

export type ValidateRegisterFormParams = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
};

export type ValidateRegisterFormResult = { isValid: boolean; message?: string };

export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface RegisterFormFieldsProps {
  titleId?: string;
  submitLabel?: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  passwordStrength: PasswordStrengthResult;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  handleFirstNameChange: (value: string) => void;
  handleLastNameChange: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

export interface UseRegisterFormParams {
  returnUrl?: string | null;
  fallbackPath?: string;
  verificationPendingPath?: string;
  onRedirect?: RegisterNavigateFn;
  onSuccess?: (result: RegisterFormSubmitResult) => void;
}

export interface UseRegisterFormReturn {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  passwordStrength?: PasswordStrengthResult;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  handleFirstNameChange: (value: string) => void;
  handleLastNameChange: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}
