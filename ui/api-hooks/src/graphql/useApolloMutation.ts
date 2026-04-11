import { useMutation as useApolloClientMutation } from '@apollo/client';
import type { DocumentNode, OperationVariables } from '@apollo/client';
import type { UseApolloMutationOptions, UseApolloMutationState } from './types';
import { parseGraphQLDocument, mapGraphQLError } from './utils';

export const useApolloMutation = <TData, TVariables extends OperationVariables = OperationVariables>(
  mutation: string | DocumentNode,
  options?: UseApolloMutationOptions<TVariables>,
): UseApolloMutationState<TData, TVariables> => {
  const document = parseGraphQLDocument(mutation);

  const [apolloMutate, { loading, error, data, reset: apolloReset }] = useApolloClientMutation<TData, TVariables>(document, {
    variables: options?.variables,
    context: options?.context,
    errorPolicy: options?.errorPolicy,
    onCompleted: options?.onCompleted,
    onError: (apolloError) => {
      const mappedError = mapGraphQLError(apolloError);
      if (mappedError && options?.onError) {
        options.onError(mappedError);
      }
    },
  });

  const mappedError = mapGraphQLError(error);

  const mutate = async (variables?: TVariables): Promise<TData | undefined> => {
    try {
      const result = await apolloMutate({ variables });
      return result.data ?? undefined;
    } catch (err) {
      return undefined;
    }
  };

  const reset = () => {
    apolloReset();
  };

  return {
    mutate,
    isLoading: loading,
    error: mappedError,
    data: data ?? undefined,
    reset,
  };
};
