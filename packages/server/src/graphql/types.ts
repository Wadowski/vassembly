import type { BaseContext } from "@apollo/server";
import type { ApolloFastifyContextFunction } from "@as-integrations/fastify";
import { FastifyInstance } from "fastify";
import type { GraphQLSchema } from "graphql";

export interface GraphQLConfig<Context extends BaseContext = BaseContext> {
  path?: string;
  schema: GraphQLSchema;
  context?: ApolloFastifyContextFunction<Context>;
}

export interface SetupGraphQLProps {
  fastify: FastifyInstance;
  config: GraphQLConfig;
}
