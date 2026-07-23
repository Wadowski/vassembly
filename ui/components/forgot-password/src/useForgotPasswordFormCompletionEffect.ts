import type { MutableRefObject } from 'react';
import { useEffect } from 'react';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import type { ForgotPasswordResponse } from '@vassembly/ui-api-hooks';
import type { SnackbarContextValue } from '@vassembly/ui-system-design/snackbar';

import { FORGOT_PASSWORD_SUCCESS_SNACKBAR_FALLBACK } from './constants';
import { formatForgotPasswordErrorMessage } from './formatForgotPasswordErrorMessage';

interface UseForgotPasswordFormCompletionEffectParams {
  forgot: {
    isLoading: boolean;
    data: ForgotPasswordResponse | undefined;
    error: CommonError | undefined;
  };
  completionPendingRef: MutableRefObject<boolean>;
  snackbar: SnackbarContextValue;
  onSuccess: (() => void) | undefined;
  setIsSuccess: (value: boolean) => void;
}

export const useForgotPasswordFormCompletionEffect = (
  params: UseForgotPasswordFormCompletionEffectParams,
): void => {
  const { forgot, completionPendingRef, snackbar, onSuccess, setIsSuccess } = params;

  useEffect(() => {
    if (!completionPendingRef.current || forgot.isLoading) {
      return;
    }

    completionPendingRef.current = false;

    if (forgot.error) {
      setIsSuccess(false);
      snackbar.show({
        message: formatForgotPasswordErrorMessage(forgot.error),
        variant: 'error',
      });
      return;
    }

    if (!forgot.data) {
      return;
    }

    if (!forgot.data.ok) {
      setIsSuccess(false);
      snackbar.show({
        message: formatForgotPasswordErrorMessage(
          new CommonError(500, ErrorTypes.INTERNAL_ERROR, 'Request failed'),
        ),
        variant: 'error',
      });
      return;
    }

    setIsSuccess(true);
    const snackMessage =
      forgot.data.message && forgot.data.message.length > 0
        ? forgot.data.message
        : FORGOT_PASSWORD_SUCCESS_SNACKBAR_FALLBACK;
    snackbar.show({
      message: snackMessage,
      variant: 'success',
    });
    onSuccess?.();
  }, [forgot.isLoading, forgot.data, forgot.error, snackbar, onSuccess, setIsSuccess, completionPendingRef]);
};
