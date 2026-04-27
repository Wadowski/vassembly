"use client";

import { GraphQLProvider, HttpClientProvider } from '@vassembly/ui-api-hooks';
import { SnackbarProvider } from '@vassembly/ui-snackbar';
import { UserAuthProvider } from '@vassembly/ui-user-auth';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <HttpClientProvider config={{ baseUrl: "http://localhost:5000" }}>
      <GraphQLProvider config={{ endpoint: "http://localhost:5000/graphql" }}>
        <UserAuthProvider>
          <SnackbarProvider position="top-right">
            <>{children}</>
          </SnackbarProvider>
        </UserAuthProvider>
      </GraphQLProvider>
    </HttpClientProvider>
  );
}