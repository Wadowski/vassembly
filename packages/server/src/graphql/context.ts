import { BaseContext } from "@apollo/server";
import { GraphQLConfig, GraphQLResolverContext } from "./types";
import { ApolloFastifyContextFunction } from "@as-integrations/fastify";

export const buildContext = <Context extends BaseContext = BaseContext>({ config }: { config: GraphQLConfig<Context> }): ApolloFastifyContextFunction<GraphQLResolverContext<Context>> => async (
  request,
  reply,
) => {
  const logger = request.log;
  if (config.context) {
    const ctx = await config.context(request, reply);
    return { ...ctx, logger };
  }
  return { logger } as GraphQLResolverContext<Context>;
};