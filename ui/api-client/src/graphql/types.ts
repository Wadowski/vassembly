import type { ApolloClient } from '@apollo/client';

export interface GraphQLClientConfig {
  endpoint: string;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => string | undefined | Promise<string | undefined>;
  defaultTimeoutMs?: number;
}

export interface QueryOptions<TVariables = Record<string, unknown>> {
  query: string;
  variables?: TVariables;
  operationName?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface GraphQLClient {
  query: <TData, TVariables = Record<string, unknown>>(
    options: QueryOptions<TVariables>,
  ) => Promise<TData>;
  mutate: <TData, TVariables = Record<string, unknown>>(
    options: QueryOptions<TVariables>,
  ) => Promise<TData>;
}


export interface RunApolloOperationProps<TVariables> {
  apollo: ApolloClient;
  config: GraphQLClientConfig;
  options: QueryOptions<TVariables>;
}

export interface RunWithApolloProps<TVariables, TData> {
  apollo: ApolloClient;
  config: GraphQLClientConfig;
  options: QueryOptions<TVariables>;
  execute: (context: {
    headers: Record<string, string>;
  }) => Promise<{ data?: TData | null }>;
}
