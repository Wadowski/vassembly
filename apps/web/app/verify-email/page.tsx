'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { CommonError } from '@vassembly/errors';
import { useHttpClient } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-system-design/text';
import { Button } from '@vassembly/ui-system-design/button';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';
import { setTokens } from '../../lib/auth/sessionStorage';
import { useResendVerificationHandler } from '../onboarding/_components/useResendVerification';

const INVALID_TOKEN_MESSAGE = 'Invalid or expired verification link';
const EXPIRED_TOKEN_MESSAGE = 'This verification link has expired';
const GENERIC_RETRY_MESSAGE = 'Something went wrong. Please try again.';

const resolveVerificationErrorMessage = ({ error }: { error: unknown }): string => {
  if (error instanceof CommonError && error.statusCode >= 500) {
    return GENERIC_RETRY_MESSAGE;
  }

  const message = error instanceof Error ? error.message : INVALID_TOKEN_MESSAGE;
  if (message === EXPIRED_TOKEN_MESSAGE) {
    return EXPIRED_TOKEN_MESSAGE;
  }

  return INVALID_TOKEN_MESSAGE;
};

function VerifyEmailContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const httpClient = useHttpClient();
  const { handleResend } = useResendVerificationHandler();
  const attemptedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || attemptedRef.current) {
      return;
    }
    attemptedRef.current = true;

    const runVerification = async (): Promise<void> => {
      setIsLoading(true);
      try {
        await httpClient.post<{ token: string }, { success: boolean }>({
          path: '/auth/verify-email',
          body: { token },
          withAuth: true,
        });
        const authResult = await httpClient.post<object, { authToken: string; refreshToken: string }>({
          path: '/auth',
          body: {},
          withAuth: true,
        });
        setTokens({
          authToken: authResult.authToken,
          refreshToken: authResult.refreshToken,
        });
        router.replace('/onboarding');
      } catch (verifyError) {
        setStatusMessage(resolveVerificationErrorMessage({ error: verifyError }));
      } finally {
        setIsLoading(false);
      }
    };

    void runVerification();
  }, [httpClient, router, token]);

  const handleResendClick = (): void => {
    void handleResend();
  };

  return (
    <main>
      {isLoading ? <Text variant="body1">Verifying your email...</Text> : null}
      {statusMessage ? <Text variant="body1">{statusMessage}</Text> : null}
      {statusMessage === EXPIRED_TOKEN_MESSAGE ? (
        <Button variant="outlined" text="Resend email" onClick={handleResendClick} />
      ) : null}
      {statusMessage === EXPIRED_TOKEN_MESSAGE || statusMessage === INVALID_TOKEN_MESSAGE ? (
        <Button
          variant="outlined"
          text="Go to onboarding"
          onClick={() => {
            router.push('/onboarding');
          }}
        />
      ) : null}
    </main>
  );
}

export default function VerifyEmailPage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath="/login">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </ProtectedAuthRoute>
  );
}
