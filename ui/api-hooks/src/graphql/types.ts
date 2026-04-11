import type { OperationVariables, ApolloQueryResult } from '@apollo/client';
import type { CommonError } from '@vassembly/errors';

export interface GraphQLClientConfig {
  endpoint: string;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => string | undefined | Promise<string | undefined>;
}

export interface GraphQLProviderProps {
  config: GraphQLClientConfig;
  children: React.ReactNode;
}

export interface UseApolloQueryOptions<TVariables extends OperationVariables = OperationVariables> {
  variables?: TVariables;
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache' | 'cache-only';
  pollInterval?: number;
  notifyOnNetworkStatusChange?: boolean;
  context?: Record<string, any>;
  errorPolicy?: 'none' | 'ignore' | 'all';
}

export interface UseApolloQueryState<TData, TVariables extends OperationVariables = OperationVariables> {
  data: TData | undefined;
  isLoading: boolean;
  error: CommonError | undefined;
  refetch: (variables?: TVariables) => Promise<ApolloQueryResult<TData>>;
  networkStatus?: number;
}

export interface UseApolloMutationOptions<TVariables extends OperationVariables = OperationVariables> {
  variables?: TVariables;
  context?: Record<string, any>;
  errorPolicy?: 'none' | 'ignore' | 'all';
  onCompleted?: (data: any) => void;
  onError?: (error: CommonError) => void;
}

export interface UseApolloMutationState<TData, TVariables extends OperationVariables = OperationVariables> {
  mutate: (variables?: TVariables) => Promise<TData | undefined>;
  isLoading: boolean;
  error: CommonError | undefined;
  data: TData | undefined;
  reset: () => void;
}
