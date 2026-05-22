'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { useAuth } from '@vassembly/ui-api-hooks';
import { useEffect, useRef } from 'react';
import { getTokens, setTokens, clearTokens } from './sessionStorage';

export const SessionBootstrap = () => {
  const { setSession, clearSession, setStatus, setBootstrapLoading } = useUserAuth();
  const { data: authResponse, isLoading, error, fetch } = useAuth();
  const initializingRef = useRef(false);

  useEffect(() => {
    if (initializingRef.current) {
      return;
    }
    initializingRef.current = true;

    const tokens = getTokens();
    if (tokens.authToken && tokens.refreshToken) {
      fetch?.({ body: {} });
    } else {
      setStatus(false);
      clearSession();
      setBootstrapLoading(false);
    }
  }, [clearSession, fetch, setStatus, setBootstrapLoading]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (error) {
      clearTokens();
      clearSession();
      setBootstrapLoading(false);
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
    setBootstrapLoading(false);
  }, [authResponse, isLoading, error, setSession, clearSession, setBootstrapLoading]);

  return null;
};
