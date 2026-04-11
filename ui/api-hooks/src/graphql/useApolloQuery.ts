import { useQuery as useApolloClientQuery } from '@apollo/client';
import type { DocumentNode, OperationVariables, ApolloQueryResult } from '@apollo/client';
import type { UseApolloQueryOptions, UseApolloQueryState } from './types';
import { parseGraphQLDocument, mapGraphQLError } from './utils';

export const useApolloQuery = <TData, TVariables extends OperationVariables = OperationVariables>(
  query: string | DocumentNode,
  options?: UseApolloQueryOptions<TVariables>,
): UseApolloQueryState<TData, TVariables> => {
  const document = parseGraphQLDocument(query);

  const { data, loading, error, refetch: apolloRefetch, networkStatus } = useApolloClientQuery<TData, TVariables>(document, {
    variables: options?.variables,
    fetchPolicy: options?.fetchPolicy,
    pollInterval: options?.pollInterval,
    notifyOnNetworkStatusChange: options?.notifyOnNetworkStatusChange,
    context: options?.context,
    errorPolicy: options?.errorPolicy,
  });

  const mappedError = mapGraphQLError(error);

  const refetch = async (variables?: TVariables): Promise<ApolloQueryResult<TData>> => {
    return apolloRefetch(variables);
  };

  return {
    data,
    isLoading: loading,
    error: mappedError,
    refetch,
    networkStatus,
  };
};
