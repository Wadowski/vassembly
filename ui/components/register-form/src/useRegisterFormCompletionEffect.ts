import type { MutableRefObject } from 'react';
import { useEffect } from 'react';
import type { CommonError } from '@vassembly/errors';
import type { SetSessionParams } from '@vassembly/ui-user-auth';
import type { SnackbarContextValue } from '@vassembly/ui-snackbar';
import { formatRegisterErrorMessage } from './formatRegisterErrorMessage';
import { mapRegisterUserToAuthUser } from './mapRegisterUserToAuthUser';
import { resolvePostRegisterTargetUrl } from './resolvePostRegisterTargetUrl';
import type { RegisterCompletionResponse, RegisterFormSubmitResult } from './types';

export interface UseRegisterFormCompletionEffectParams {
  register: {
    isLoading: boolean;
    data: RegisterCompletionResponse | undefined;
    error: CommonError | undefined;
  };
  completionPendingRef: MutableRefObject<boolean>;
  snackbar: SnackbarContextValue;
  setSession: (params: SetSessionParams) => void;
  returnUrl: string | null | undefined;
  fallbackPath: string | undefined;
  verificationPendingPath?: string;
  onRedirect: ((href: string) => void) | undefined;
  onSuccess: ((result: RegisterFormSubmitResult) => void) | undefined;
}

export const useRegisterFormCompletionEffect = (
  params: UseRegisterFormCompletionEffectParams,
): void => {
  const {
    register,
    completionPendingRef,
    snackbar,
    setSession,
    returnUrl,
    fallbackPath,
    verificationPendingPath,
    onRedirect,
    onSuccess,
  } = params;

  useEffect(() => {
    if (!completionPendingRef.current || register.isLoading) {
      return;
    }
    completionPendingRef.current = false;
    if (register.error) {
      snackbar.show({ message: formatRegisterErrorMessage(register.error), variant: 'error' });
      return;
    }
    if (!register.data) {
      return;
    }
    const user = mapRegisterUserToAuthUser(register.data.user);
    setSession({ user, status: 'authenticated' });
    const result: RegisterFormSubmitResult = {
      authToken: register.data.authToken,
      refreshToken: register.data.refreshToken,
      user,
      requiresEmailVerification: register.data.requiresEmailVerification,
    };
    onSuccess?.(result);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { href: resolvedHref } = resolvePostRegisterTargetUrl({
      returnUrl,
      fallbackPath: fallbackPath ?? '/',
      origin,
    });
    const href =
      register.data.requiresEmailVerification === true && verificationPendingPath !== undefined && verificationPendingPath !== ''
        ? verificationPendingPath
        : resolvedHref;
    if (register.data.requiresEmailVerification) {
      snackbar.show({
        message: 'Please verify your email to confirm your account.',
        variant: 'info',
        duration: 4000,
      });
    } else {
      snackbar.show({ message: 'Account created successfully.', variant: 'success', duration: 1500 });
    }
    if (onRedirect) {
      onRedirect(href);
    } else if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  }, [
    register.isLoading,
    register.data,
    register.error,
    snackbar,
    setSession,
    returnUrl,
    fallbackPath,
    verificationPendingPath,
    onRedirect,
    onSuccess,
    completionPendingRef,
  ]);
};
