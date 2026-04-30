'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { useAuth } from '@vassembly/ui-api-hooks';
import { useEffect } from 'react';
import { getTokens, setTokens, clearTokens } from './sessionStorage';

export const SessionBootstrap = () => {
  const { setSession, clearSession, setStatus } = useUserAuth();
  const { data: authResponse, isLoading, error, fetch } = useAuth();

  useEffect(() => {
    fetch?.({ body: {} as any });
  }, []);

  useEffect(() => {
    const tokens = getTokens();

    if (!tokens.authToken || !tokens.refreshToken) {
      clearSession();
      return;
    }

    setStatus(false);
  }, [setStatus, clearSession]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (error) {
      clearTokens();
      clearSession();
      return;
    }

    if (!authResponse) {
      return;
    }

    const newTokens = {
      authToken: authResponse.authToken,
      refreshToken: authResponse.refreshToken,
    };
    setTokens(newTokens);

    const tokens = getTokens();
    if (tokens.authToken) {
      setSession({
        user: {
          id: authResponse.user?.id ?? authResponse.data.userId,
          email: authResponse.user?.email ?? '',
          firstName: authResponse.user?.firstName,
          lastName: authResponse.user?.lastName,
          verifiedAt: authResponse.user?.verifiedAt ? new Date(authResponse.user.verifiedAt) : undefined,
          role: authResponse.user?.role,
        },
      });
    }
  }, [authResponse, isLoading, error, setSession, clearSession]);

  return null;
};
