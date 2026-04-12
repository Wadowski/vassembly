import { useMemo, useCallback } from 'react';
import { useLazyQuery as useApolloClientLazyQuery } from '@apollo/client';
import type { DocumentNode, OperationVariables, ApolloQueryResult } from '@apollo/client';
import type { UseApolloLazyQueryState, UseApolloQueryOptions } from './types';
import { parseGraphQLDocument, mapGraphQLError } from './utils';

export const useApolloLazyQuery = <TData, TVariables extends OperationVariables = OperationVariables>(
  query: string | DocumentNode,
  options?: UseApolloQueryOptions<TVariables>,
): UseApolloLazyQueryState<TData, TVariables> => {
  // Memoize the document to prevent Apollo from re-initializing on every render
  const document = useMemo(
    () => parseGraphQLDocument(query),
    // Use the query string representation as dependency, not the object
    [typeof query === 'string' ? query : JSON.stringify(query)],
  );

  const [execute, { data, loading, error, networkStatus }] = useApolloClientLazyQuery<TData, TVariables>(document, {
    variables: options?.variables,
    fetchPolicy: options?.fetchPolicy,
    pollInterval: options?.pollInterval,
    notifyOnNetworkStatusChange: options?.notifyOnNetworkStatusChange,
    context: options?.context,
    errorPolicy: options?.errorPolicy,
  });

  const mappedError = mapGraphQLError(error);

  const executeQuery = useCallback(
    async (variables?: TVariables): Promise<ApolloQueryResult<TData | undefined>> => {
      return execute({ variables });
    },
    [execute],
  );

  const result = useMemo(
    () => ({
      execute: executeQuery,
      data: data ?? undefined,
      isLoading: loading,
      error: mappedError,
    }),
    [executeQuery, data, loading, mappedError],
  );

  return result;
};
