import React, { useMemo } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloInstance } from './createApolloInstance';
import type { GraphQLClientConfig } from './types';

const ApolloProviderComponent = ApolloProvider as React.ComponentType<any>;

interface GraphQLProviderProps {
  config: GraphQLClientConfig;
  children: React.ReactNode;
}

export function GraphQLProvider({ config, children }: GraphQLProviderProps) {
  const apolloClient = useMemo(() => createApolloInstance(config), [config]);

  return <ApolloProviderComponent client={apolloClient}>{children}</ApolloProviderComponent>;
}
