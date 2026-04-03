import type { BuildGraphQLConfigProps, GraphQLConfigResult } from './types';

export const buildGraphQLConfig = ({
  builder,
  path,
}: BuildGraphQLConfigProps): GraphQLConfigResult => {
  return {
    schema: builder.toSchema(),
    path,
  };
};
