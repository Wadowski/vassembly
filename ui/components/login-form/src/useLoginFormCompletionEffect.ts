import type { MutableRefObject } from 'react';
import { useEffect } from 'react';
import type { CommonError } from '@vassembly/errors';
import type { SetSessionParams } from '@vassembly/ui-user-auth';
import type { SnackbarContextValue } from '@vassembly/ui-snackbar';
import { formatLoginErrorMessage } from './formatLoginErrorMessage';
import { mapLoginUserToAuthUser } from './mapLoginUserToAuthUser';
import { resolvePostLoginTargetUrl } from './resolvePostLoginTargetUrl';
import type {
  LoginFormSubmitResult,
  LoginNavigateFn,
  MapLoginUserToAuthUserParams,
} from './types';

type LoginResponse = {
  authToken: string;
  refreshToken: string;
  user: MapLoginUserToAuthUserParams;
};

interface UseLoginFormCompletionEffectParams {
  login: {
    isLoading: boolean;
    data: LoginResponse | undefined;
    error: CommonError | undefined;
  };
  completionPendingRef: MutableRefObject<boolean>;
  snackbar: SnackbarContextValue;
  setSession: (params: SetSessionParams) => void;
  returnUrl: string | null | undefined;
  fallbackPath: string | undefined;
  onRedirect: LoginNavigateFn | undefined;
  onSuccess: ((result: LoginFormSubmitResult) => void) | undefined;
}

export const useLoginFormCompletionEffect = (params: UseLoginFormCompletionEffectParams): void => {
  const {
    login,
    completionPendingRef,
    snackbar,
    setSession,
    returnUrl,
    fallbackPath,
    onRedirect,
    onSuccess,
  } = params;

  useEffect(() => {
    if (!completionPendingRef.current || login.isLoading) {
      return;
    }

    completionPendingRef.current = false;

    if (login.error) {
      snackbar.show({
        message: formatLoginErrorMessage(login.error),
        variant: 'error',
      });
      return;
    }

    if (!login.data) {
      return;
    }

    const user = mapLoginUserToAuthUser(login.data.user);
    setSession({ user, status: 'authenticated' });

    const result: LoginFormSubmitResult = {
      authToken: login.data.authToken,
      refreshToken: login.data.refreshToken,
      user,
    };
    onSuccess?.(result);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { href } = resolvePostLoginTargetUrl({
      returnUrl,
      fallbackPath: fallbackPath ?? '/',
      origin,
    });

    snackbar.show({
      message: 'Signed in successfully',
      variant: 'success',
      duration: 1500,
    });

    if (onRedirect) {
      onRedirect(href);
    } else if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  }, [login.isLoading, login.data, login.error, login, snackbar, setSession, returnUrl, fallbackPath, onRedirect, onSuccess, completionPendingRef]);
};
