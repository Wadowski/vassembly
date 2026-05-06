import type { FormEvent, MutableRefObject } from 'react';
import type { CommonError } from '@vassembly/errors';
import type { ResetPasswordResponse } from '@vassembly/ui-api-hooks';
import type { SnackbarContextValue } from '@vassembly/ui-snackbar';

export interface ResetPasswordFormProps {
  token: string;
  titleId?: string;
  className?: string;
  submitLabel?: string;
  onSuccess?: () => void;
}

export interface UseResetPasswordFormParams {
  token: string;
  onSuccess?: () => void;
}

export interface UseResetPasswordFormReturn {
  password: string;
  confirmPassword: string;
  passwordError: string | undefined;
  confirmPasswordError: string | undefined;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  handlePasswordBlur: () => void;
  handleConfirmBlur: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

export type ValidateResetPasswordFormParams = {
  password: string;
  confirmPassword: string;
};

export type ValidateResetPasswordFormResult = {
  passwordError?: string;
  confirmPasswordError?: string;
  isValid: boolean;
};

export interface UseResetPasswordFormCompletionEffectParams {
  reset: {
    isPending: boolean;
    data: ResetPasswordResponse | undefined;
    error: CommonError | undefined;
  };
  completionPendingRef: MutableRefObject<boolean>;
  snackbar: SnackbarContextValue;
  onSuccess: (() => void) | undefined;
}
