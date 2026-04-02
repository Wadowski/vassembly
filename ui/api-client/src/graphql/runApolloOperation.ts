import { parseGraphQLDocument } from './parseGraphQLDocument';
import { runWithApollo } from './runWithApollo';
import type { QueryOptions, RunApolloOperationProps } from './types';

export const runApolloQuery = async <TData, TVariables>({ apollo, config, options }: RunApolloOperationProps<TVariables>): Promise<TData> => {
  const document = parseGraphQLDocument(options.query);

  return runWithApollo<TData>({
    apollo,
    config,
    options: options as QueryOptions<unknown>,
    execute: (context) =>
      apollo.query({
        query: document,
        variables: (options.variables ?? {}) as Record<string, unknown>,
        context,
        ...(options.operationName !== undefined
          ? { operationName: options.operationName }
          : {}),
      }),
  });
};

export const runApolloMutate = async <TData, TVariables>({
  apollo,
  config,
  options,
}: RunApolloOperationProps<TVariables>): Promise<TData> => {
  const document = parseGraphQLDocument(options.query);

  return runWithApollo<TData>({
    apollo,
    config,
    options: options as QueryOptions<unknown>,
    execute: (context) =>
      apollo.mutate({
        mutation: document,
        variables: (options.variables ?? {}) as Record<string, unknown>,
        context,
        ...(options.operationName !== undefined
          ? { operationName: options.operationName }
          : {}),
      }),
  });
};
