import { useEffect } from 'react';

import { RESET_PASSWORD_COMPLETION_DELAY_MS, RESET_PASSWORD_SUCCESS_SNACKBAR_MESSAGE } from './constants';
import { formatResetPasswordErrorMessage } from './formatResetPasswordErrorMessage';
import type { UseResetPasswordFormCompletionEffectParams } from './types';

export const useResetPasswordFormCompletionEffect = (
  params: UseResetPasswordFormCompletionEffectParams,
): void => {
  const { reset, completionPendingRef, snackbar, onSuccess } = params;

  useEffect(() => {
    if (!completionPendingRef.current || reset.isPending) {
      return undefined;
    }

    completionPendingRef.current = false;

    if (reset.error !== undefined) {
      snackbar.show({
        message: formatResetPasswordErrorMessage(reset.error),
        variant: 'error',
      });
      return undefined;
    }

    if (reset.data === undefined) {
      return undefined;
    }

    snackbar.show({
      message: RESET_PASSWORD_SUCCESS_SNACKBAR_MESSAGE,
      variant: 'success',
    });

    const timeoutId = window.setTimeout(() => {
      onSuccess?.();
    }, RESET_PASSWORD_COMPLETION_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    reset.isPending,
    reset.data,
    reset.error,
    snackbar,
    onSuccess,
    completionPendingRef,
  ]);
};
