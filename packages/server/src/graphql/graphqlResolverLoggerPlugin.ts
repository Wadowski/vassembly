import type { ApolloServerPlugin, BaseContext } from "@apollo/server";
import { responsePathAsArray, type GraphQLResolveInfo } from "graphql";
import type { GraphQLResolverContext } from "./types";

const formatFieldPath = (info: GraphQLResolveInfo): string =>
  responsePathAsArray(info.path).join(".");

export const createGraphqlResolverLoggerPlugin = <
  Context extends BaseContext = BaseContext,
>(): ApolloServerPlugin<GraphQLResolverContext<Context>> => ({
  async requestDidStart() {
    return {
      async executionDidStart() {
        return {
          willResolveField({ args, contextValue, info }) {
            const log = contextValue.logger;
            const path = formatFieldPath(info);
            const startedAt = performance.now();
            log.info({
              msg: "graphql resolver invoked",
              path,
              fieldName: info.fieldName,
              parentType: info.parentType.name,
              returnType: info.returnType.toString(),
              argNames: Object.keys(args as Record<string, unknown>),
            });
            return (error: Error | null) => {
              const durationMs = Math.round(performance.now() - startedAt);
              if (error) {
                log.error({
                  err: error,
                  msg: "graphql resolver failed",
                  path,
                  fieldName: info.fieldName,
                  durationMs,
                });
                return;
              }
              log.info({
                msg: "graphql resolver completed",
                path,
                fieldName: info.fieldName,
                durationMs,
              });
            };
          },
        };
      },
    };
  },
});
