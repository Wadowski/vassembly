'use client';

import { useCallback, useEffect, useState } from 'react';

import { useResendVerification, useHttpClient } from '@vassembly/ui-api-hooks';
import { TooManyRequestsError } from '@vassembly/errors';

export interface UseResendVerificationResult {
  handleResend: () => Promise<void>;
  isLoading: boolean;
  cooldownSeconds: number | null;
  errorMessage: string | null;
  successMessage: string | null;
}

export const useResendVerificationHandler = (): UseResendVerificationResult => {
  const { isLoading } = useResendVerification();
  const httpClient = useHttpClient();
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownSeconds == null || cooldownSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => {
        if (current == null || current <= 1) {
          return null;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResend = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await httpClient.post<never, { success: boolean }>({
        path: '/auth/resend-verification',
        withAuth: true,
      });
      if (result.success) {
        setSuccessMessage('Verification email sent.');
      }
    } catch (error) {
      if (error instanceof TooManyRequestsError && error.retryAfterSeconds != null) {
        setCooldownSeconds(error.retryAfterSeconds);
        return;
      }
      setErrorMessage('Something went wrong. Please try again.');
    }
  }, [httpClient]);

  return {
    handleResend,
    isLoading,
    cooldownSeconds,
    errorMessage,
    successMessage,
  };
};
