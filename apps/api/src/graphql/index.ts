import { createBuilder, buildGraphQLConfig } from '@vassembly/graphql';
import type { GraphQLConfigResult } from '@vassembly/graphql';
import userDomain from '@vassembly/domain-user';

import { registerUserResolvers } from './resolvers/user';

const builder = createBuilder();

userDomain.gqlSchema(builder);
registerUserResolvers(builder);

export const graphqlConfig: GraphQLConfigResult = buildGraphQLConfig({
  builder,
  path: '/graphql',
});
