import { ApolloServer } from "@apollo/server";
import fastifyApollo, { fastifyApolloDrainPlugin } from "@as-integrations/fastify";

import { formatGraphQlError } from "./formatGraphQlError";
import type { SetupGraphQLProps } from "./types";

export const setupGraphQL = async ({ fastify, config }: SetupGraphQLProps): Promise<void> => {
  const apollo = new ApolloServer({
    schema: config.schema,
    formatError: formatGraphQlError,
    plugins: [fastifyApolloDrainPlugin(fastify)],
  });

  await apollo.start();
  await fastify.register(fastifyApollo(apollo), {
    path: config.path ?? "/graphql",
    ...(config.context ? { context: config.context } : {}),
  });
};
