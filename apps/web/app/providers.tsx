"use client";

import { GraphQLProvider, HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-system-design/snackbar';
import { UserAuthProvider } from '@vassembly/ui-user-auth';
import React from 'react';
import { config } from '@vassembly/config';

import { getAuthTokenForHeader, getRefreshTokenForHeader } from '../lib/auth/sessionStorage';
import { SessionBootstrap } from '../lib/auth/SessionBootstrap';

interface ProvidersProps {
  children: React.ReactNode;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:${config.services.api.port}`;

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