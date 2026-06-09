import type { ApolloServerPlugin, BaseContext } from "@apollo/server";
import { responsePathAsArray, type GraphQLResolveInfo } from "graphql";
import type { GraphQLResolverContext } from "./types";

const formatFieldPath = (info: GraphQLResolveInfo): string =>
  responsePathAsArray(info.path).join(".");

const isIntrospectionQuery = (fieldName: string): boolean =>
  fieldName.startsWith("__");

const getParentPath = (info: GraphQLResolveInfo): string => {
  const pathArray = responsePathAsArray(info.path);
  return pathArray.slice(0, -1).join(".");
};

interface ResolverTimer {
  fieldName: string;
  startedAt: number;
  parentType: string;
  returnType: string;
  argNames: string[];
}

const timersByParentPath = new Map<string, ResolverTimer[]>();

export const createGraphqlResolverLoggerPlugin = <
  Context extends BaseContext = BaseContext,
>(): ApolloServerPlugin<GraphQLResolverContext<Context>> => ({
  async requestDidStart() {
    timersByParentPath.clear();
    return {
      async executionDidStart() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let logger: any = null;

        return {
          willResolveField({ args, contextValue, info }) {
            const log = contextValue.logger;
            logger = log;
            const fieldName = info.fieldName;

            if (isIntrospectionQuery(fieldName)) {
              return;
            }

            const parentPath = getParentPath(info);
            const startedAt = performance.now();

            if (!timersByParentPath.has(parentPath)) {
              timersByParentPath.set(parentPath, []);
            }

            timersByParentPath.get(parentPath)!.push({
              fieldName,
              startedAt,
              parentType: info.parentType.name,
              returnType: info.returnType.toString(),
              argNames: Object.keys(args as Record<string, unknown>),
            });

            return (error: Error | null) => {
              const durationMs = Math.round(performance.now() - startedAt);
              const path = formatFieldPath(info);

              if (error) {
                log.error({
                  err: error,
                  msg: "graphql resolver failed",
                  path,
                  fieldName,
                  durationMs,
                });
              }
            };
          },

          async executionDidEnd() {
            if (!logger) return;

            for (const [parentPath, timers] of timersByParentPath) {
              if (timers.length === 0) continue;

              const fieldEntries = timers.map((timer) => timer.fieldName);

              logger.info({
                msg: "graphql resolver batch completed",
                parentPath: parentPath || "root",
                fieldsCount: timers.length,
                fields: fieldEntries,
                parentType: timers[0]!.parentType,
              });
            }

            timersByParentPath.clear();
          },
        };
      },
    };
  },
});
