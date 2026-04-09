import { createApolloInstance } from './createApolloInstance';
import { runApolloMutate, runApolloQuery } from './runApolloOperation';
import type { GraphQLClient, GraphQLClientConfig, QueryOptions } from './types';

export const createGraphQLClient = (config: GraphQLClientConfig): GraphQLClient => {
  const apollo = createApolloInstance(config);

  const query = async <TData, TVariables = Record<string, unknown>>(options: QueryOptions<TVariables>) =>
    runApolloQuery<TData, TVariables>({ apollo, config, options });

  const mutate = async <TData, TVariables = Record<string, unknown>>(options: QueryOptions<TVariables>) =>
    runApolloMutate<TData, TVariables>({ apollo, config, options });

  return { query, mutate };
};
