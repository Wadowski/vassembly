import type { FormEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useLogin } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { useUserAuth } from '@vassembly/ui-user-auth';
import { validateLoginForm } from './validateLoginForm';
import { useLoginFormCompletionEffect } from './useLoginFormCompletionEffect';
import type { UseLoginFormParams, UseLoginFormReturn } from './types';

export const useLoginForm = (params: UseLoginFormParams): UseLoginFormReturn => {
  const { returnUrl, fallbackPath, onRedirect, onSuccess } = params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const { setSession } = useUserAuth();
  const snackbar = useSnackbar();
  const completionPendingRef = useRef(false);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (login.isLoading) {
        return;
      }

      const validation = validateLoginForm({ email, password });
      if (!validation.isValid) {
        snackbar.show({ message: validation?.message ?? '', variant: 'error' });
        return;
      }

      completionPendingRef.current = true;
      await login.fetch({
        body: { email: email.trim(), password: password.trim() },
      });
    },
    [email, password, login, snackbar],
  );

  useLoginFormCompletionEffect({
    login,
    completionPendingRef,
    snackbar,
    setSession,
    returnUrl,
    fallbackPath,
    onRedirect,
    onSuccess,
  });

  return {
    email,
    password,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
    isLoading: login.isLoading,
  };
};
