import type { FormEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useResetPassword } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-system-design/snackbar';

import {
  getResetPasswordConfirmBlurError,
  getResetPasswordPolicyFieldError,
} from './getResetPasswordFieldErrors';
import { useResetPasswordFormCompletionEffect } from './useResetPasswordFormCompletionEffect';
import { validateResetPasswordForm } from './validateResetPasswordForm';
import type { UseResetPasswordFormParams, UseResetPasswordFormReturn } from './types';

export const useResetPasswordForm = (params: UseResetPasswordFormParams): UseResetPasswordFormReturn => {
  const { token, onSuccess } = params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const reset = useResetPassword();
  const snackbar = useSnackbar();
  const completionPendingRef = useRef(false);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(undefined);
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordError(undefined);
  }, []);

  const handlePasswordBlur = useCallback(() => {
    const err = getResetPasswordPolicyFieldError({ password, treatEmptyAsInvalid: true });
    setPasswordError(err);
  }, [password]);

  const handleConfirmBlur = useCallback(() => {
    const err = getResetPasswordConfirmBlurError({ password, confirmPassword });
    setConfirmPasswordError(err);
  }, [confirmPassword, password]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (reset.isPending) {
        return;
      }
      const validation = validateResetPasswordForm({ password, confirmPassword });
      if (validation.isValid === false) {
        setPasswordError(validation.passwordError);
        setConfirmPasswordError(validation.confirmPasswordError);
        return;
      }
      completionPendingRef.current = true;
      await reset.mutate({ token: token.trim(), password: password.trim() });
    },
    [confirmPassword, password, reset, token],
  );

  useResetPasswordFormCompletionEffect({
    reset,
    completionPendingRef,
    snackbar,
    onSuccess,
  });

  return {
    password,
    confirmPassword,
    passwordError,
    confirmPasswordError,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handlePasswordBlur,
    handleConfirmBlur,
    handleSubmit,
    isLoading: reset.isPending,
  };
};
