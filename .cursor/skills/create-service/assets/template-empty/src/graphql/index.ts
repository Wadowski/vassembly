import { createBuilder, applyResolvers, buildGraphQLConfig } from '@vassembly/graphql';
import type { GraphQLConfigResult } from '@vassembly/graphql';

// Import domain schemas
// import { defineDomainSchema } from '@vassembly/domain-example';
// import exampleDomain from '@vassembly/domain-example';

const builder = createBuilder();

// Register domain schemas
// defineDomainSchema(builder);

// Apply resolvers
applyResolvers({
  builder,
  queries: (t) => ({
    // Add query resolvers here
    // Example:
    // example: t.field({
    //   type: 'Example',
    //   args: { id: t.arg.id({ required: true }) },
    //   resolve: async (_, args) => {
    //     return await exampleDomain.queries.getById({ id: args.id as string });
    //   },
    // }),
  }),
  mutations: (t) => ({
    // Add mutation resolvers here
  }),
});

export const graphqlConfig: GraphQLConfigResult = buildGraphQLConfig({
  builder,
  path: '/graphql',
});
