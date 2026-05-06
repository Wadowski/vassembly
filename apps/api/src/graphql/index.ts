import { createBuilder, buildGraphQLConfig } from '@vassembly/graphql';
import type { GraphQLConfig } from '@vassembly/server';
import * as userDomain from '@vassembly/domain-user';

import { createApiGraphQLContext } from './context';
import { registerUserResolvers } from './resolvers/user';

const builder = createBuilder();

userDomain.gqlSchema(builder);
registerUserResolvers(builder);

const { schema, path } = buildGraphQLConfig({
  builder,
  path: '/graphql',
});

export const graphqlConfig: GraphQLConfig<{ authenticatedUserId: string | undefined }> = {
  schema,
  path,
  context: createApiGraphQLContext,
};
