import { useMemo, useCallback } from 'react';
import { useQuery as useApolloClientQuery } from '@apollo/client';
import type { DocumentNode, OperationVariables, ApolloQueryResult } from '@apollo/client';
import type { UseApolloQueryOptions, UseApolloQueryState } from './types';
import { parseGraphQLDocument, mapGraphQLError } from './utils';

export const useApolloQuery = <TData, TVariables extends OperationVariables = OperationVariables>(
  query: string | DocumentNode,
  options?: UseApolloQueryOptions<TVariables>,
): UseApolloQueryState<TData, TVariables> => {
  // Memoize the document to prevent Apollo from re-initializing on every render
  const document = useMemo(
    () => parseGraphQLDocument(query),
    // Use the query string representation as dependency, not the object
    [typeof query === 'string' ? query : JSON.stringify(query)],
  );

  const { data, loading, error, refetch: apolloRefetch, networkStatus } = useApolloClientQuery<TData, TVariables>(document, {
    variables: options?.variables,
    fetchPolicy: options?.fetchPolicy,
    pollInterval: options?.pollInterval,
    notifyOnNetworkStatusChange: options?.notifyOnNetworkStatusChange,
    context: {
      ...options?.context,
      ...(options?.withAuth && { withAuth: true }),
    },
    errorPolicy: options?.errorPolicy,
    skip: options?.skip,
  });

  const mappedError = mapGraphQLError(error);

  const refetch = useCallback(
    async (variables?: TVariables): Promise<ApolloQueryResult<TData>> => {
      return apolloRefetch(variables);
    },
    [apolloRefetch],
  );

  const result = useMemo(
    () => ({
      data,
      isLoading: loading,
      error: mappedError,
      refetch,
      networkStatus,
    }),
    [data, loading, mappedError, refetch, networkStatus],
  );

  return result;
};
