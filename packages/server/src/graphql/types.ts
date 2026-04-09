import type { BaseContext } from "@apollo/server";
import type { ApolloFastifyContextFunction } from "@as-integrations/fastify";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { GraphQLSchema } from "graphql";

export type GraphQLResolverContext<Context extends BaseContext = BaseContext> = Context & {
  logger: FastifyBaseLogger;
};

export interface GraphQLConfig<Context extends BaseContext = BaseContext> {
  path?: string;
  schema: GraphQLSchema;
  context?: ApolloFastifyContextFunction<Context>;
}

export interface SetupGraphQLProps<Context extends BaseContext = BaseContext> {
  fastify: FastifyInstance;
  config: GraphQLConfig<Context>;
}
