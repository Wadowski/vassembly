import { createBuilder, applyResolvers, buildGraphQLConfig } from '@vassembly/graphql';
import userDomain from '@vassembly/domain-user';
import type { GraphQLConfigResult } from '@vassembly/graphql';

const builder = createBuilder();

userDomain.gqlSchema(builder);

applyResolvers({
  builder,
  queries: (t) => ({
    user: t.field({
      type: 'User',
      args: { id: t.arg.id({ required: true }) },
      resolve: async (_: any, args: any) => {
        const user = await userDomain.queries.getById({ id: args.id as string });
        return user;
      },
    }),
  }),
});

export const graphqlConfig: GraphQLConfigResult = buildGraphQLConfig({
  builder,
  path: '/graphql',
});
