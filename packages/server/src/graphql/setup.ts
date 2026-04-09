import { ApolloServer, type BaseContext } from "@apollo/server";
import fastifyApollo, {
  fastifyApolloDrainPlugin,
} from "@as-integrations/fastify";
import { formatGraphQlError } from "./formatGraphQlError";
import { createGraphqlResolverLoggerPlugin } from "./graphqlResolverLoggerPlugin";
import type { GraphQLResolverContext, SetupGraphQLProps } from "./types";
import { buildContext } from "./context";

export const setupGraphQL = async <Context extends BaseContext = BaseContext>({
  fastify,
  config,
}: SetupGraphQLProps<Context>): Promise<void> => {

  const apollo = new ApolloServer<GraphQLResolverContext<Context>>({
    schema: config.schema,
    formatError: formatGraphQlError,
    plugins: [fastifyApolloDrainPlugin(fastify), createGraphqlResolverLoggerPlugin<Context>()],
  });

  await apollo.start();
  await fastify.register(fastifyApollo(apollo), {
    path: config.path ?? "/graphql",
    context: buildContext({ config }),
  });
};
