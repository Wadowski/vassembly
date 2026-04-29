import type { FormEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useForgotPassword } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { useForgotPasswordFormCompletionEffect } from './useForgotPasswordFormCompletionEffect';
import { validateForgotPasswordForm } from './validateForgotPasswordForm';
import type { UseForgotPasswordFormParams, UseForgotPasswordFormReturn } from './types';

export const useForgotPasswordForm = (params: UseForgotPasswordFormParams): UseForgotPasswordFormReturn => {
  const { onSuccess } = params;
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const forgot = useForgotPassword();
  const snackbar = useSnackbar();
  const completionPendingRef = useRef(false);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (forgot.isLoading) {
        return;
      }

      const validation = validateForgotPasswordForm({ email });
      if (!validation.isValid) {
        snackbar.show({ message: validation.message, variant: 'error' });
        return;
      }

      completionPendingRef.current = true;
      await forgot.fetch({
        body: { email: email.trim() },
      });
    },
    [email, forgot, snackbar],
  );

  useForgotPasswordFormCompletionEffect({
    forgot,
    completionPendingRef,
    snackbar,
    onSuccess,
    setIsSuccess,
  });

  return {
    email,
    handleEmailChange,
    handleSubmit,
    isLoading: forgot.isLoading,
    isSuccess,
  };
};
