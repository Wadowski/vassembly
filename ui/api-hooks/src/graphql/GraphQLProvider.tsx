import React, { useMemo } from 'react';
import type { ApolloProviderProps } from '@apollo/client';
import { ApolloProvider } from '@apollo/client';
import { createApolloInstance } from './createApolloInstance';
import type { GraphQLClientConfig } from './types';

const ApolloProviderComponent = ApolloProvider as React.ComponentType<ApolloProviderProps>;

interface GraphQLProviderProps {
  config: GraphQLClientConfig;
  children: React.ReactNode;
}

export function GraphQLProvider({ config, children }: GraphQLProviderProps) {
  const apolloClient = useMemo(() => createApolloInstance(config), [config]);

  return <ApolloProviderComponent client={apolloClient}>{children}</ApolloProviderComponent>;
}
