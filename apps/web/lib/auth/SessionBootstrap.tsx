'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { useAuth } from '@vassembly/ui-api-hooks';
import { useEffect } from 'react';
import { getTokens, setTokens, clearTokens } from './sessionStorage';

export const SessionBootstrap = () => {
  const { setSession, clearSession, setStatus } = useUserAuth();
  const { data: authResponse, isLoading, error, fetch } = useAuth();

  useEffect(() => {
    fetch?.({ body: {} });
  }, []);

  useEffect(() => {
    const tokens = getTokens();

    if (!tokens.authToken || !tokens.refreshToken) {
      clearSession();
      return;
    }

    setStatus('loading');
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

    if (authResponse.refreshToken) {
      setTokens({ refreshToken: authResponse.refreshToken });
    }

    const tokens = getTokens();
    if (tokens.authToken) {
      setSession({
        user: {
          id: 'verified',
          roles: [],
        },
      });
    }
  }, [authResponse, isLoading, error, setSession, clearSession]);

  return null;
};
