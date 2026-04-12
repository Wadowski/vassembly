"use client";

import { GraphQLProvider, HttpClientProvider } from '@vassembly/ui-api-hooks';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <HttpClientProvider config={{ baseUrl: "http://localhost:5000" }}>
      <GraphQLProvider config={{ endpoint: "http://localhost:5000/graphql" }}>
        {children}
      </GraphQLProvider>
    </HttpClientProvider>
  );
}