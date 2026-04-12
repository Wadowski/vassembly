import React, { useMemo } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloInstance } from './createApolloInstance';
import type { GraphQLClientConfig } from './types';

const ApolloProviderComponent = ApolloProvider as React.ComponentType<any>;

interface GraphQLProviderProps {
  config: GraphQLClientConfig;
  children: React.ReactNode;
}

export const GraphQLProvider: React.FC<GraphQLProviderProps> = ({ config, children }) => {
  const apolloClient = useMemo(() => createApolloInstance(config), [config]);

  return <ApolloProviderComponent client={apolloClient}>{children}</ApolloProviderComponent>;
};
