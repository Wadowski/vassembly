'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useHttpClient } from '@vassembly/ui-api-hooks';
import { Text } from '@vassembly/ui-text';
import { Button } from '@vassembly/ui-button';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';
import { setTokens } from '../../lib/auth/sessionStorage';

const INVALID_TOKEN_MESSAGE = 'Invalid or expired verification link';
const EXPIRED_TOKEN_MESSAGE = 'This verification link has expired';

function VerifyEmailContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const httpClient = useHttpClient();
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
        const message =
          verifyError instanceof Error ? verifyError.message : INVALID_TOKEN_MESSAGE;
        if (message.toLowerCase().includes('expired')) {
          setStatusMessage(EXPIRED_TOKEN_MESSAGE);
          return;
        }
        setStatusMessage(INVALID_TOKEN_MESSAGE);
      } finally {
        setIsLoading(false);
      }
    };

    void runVerification();
  }, [httpClient, router, token]);

  return (
    <main>
      {isLoading ? <Text variant="body1">Verifying your email...</Text> : null}
      {statusMessage ? <Text variant="body1">{statusMessage}</Text> : null}
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
