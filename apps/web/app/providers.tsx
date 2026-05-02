"use client";

import { GraphQLProvider, HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-snackbar';
import { UserAuthProvider } from '@vassembly/ui-user-auth';
import React from 'react';
import { getAuthTokenForHeader, getRefreshTokenForHeader } from '../lib/auth/sessionStorage';
import { SessionBootstrap } from '../lib/auth/SessionBootstrap';

interface ProvidersProps {
  children: React.ReactNode;
}

const BASE_URL = "http://localhost:5000";

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <HttpClientProvider
      config={{
        baseUrl: BASE_URL,
        getAuthToken: getAuthTokenForHeader,
        getRefreshToken: getRefreshTokenForHeader,
      }}
    >
      <GraphQLProvider
        config={{
          endpoint: `${BASE_URL}/graphql`,
          getAuthToken: getAuthTokenForHeader,
          getRefreshToken: getRefreshTokenForHeader,
        }}
      >
        <UserAuthProvider>
          <SessionBootstrap />
          <SnackbarProvider position="bottom-left">
            <>{children}</>
          </SnackbarProvider>
        </UserAuthProvider>
      </GraphQLProvider>
    </HttpClientProvider>
  );
}