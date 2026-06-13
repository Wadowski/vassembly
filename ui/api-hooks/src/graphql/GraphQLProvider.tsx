import React, { useMemo } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloInstance } from './createApolloInstance';
import type { GraphQLClientConfig } from './types';

interface GraphQLProviderProps {
  config: GraphQLClientConfig;
  children: React.ReactNode;
}

export function GraphQLProvider({ config, children }: GraphQLProviderProps) {
  const apolloClient = useMemo(() => createApolloInstance(config), [config]);

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
