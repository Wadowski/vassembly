import type { FastifyInstance, RouteHandlerMethod } from "fastify";
import type { RouteShorthandOptions } from "fastify";
import type { z, ZodTypeAny } from "zod";

import type { GraphQLConfig } from "./graphql/types";

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RouteDefinition {
  method: HTTPMethod;
  url: string;
  handler: (input: { body: unknown; query: unknown }) => Promise<unknown>;
  schema?: { body?: ZodTypeAny; querystring?: ZodTypeAny; response?: ZodTypeAny };
}

export interface ServerConfig {
  routes?: RouteDefinition[];
  graphql?: GraphQLConfig;
}

export interface StartServerProps {
  routes: RouteDefinition[];
  port: number;
}

export type RegisterFn = (
  path: string,
  opts: RouteShorthandOptions,
  handler: RouteHandlerMethod,
) => FastifyInstance;

export interface RegisterRoutesProps {
  fastify: FastifyInstance;
  routes: RouteDefinition[];
}


export type RouteSchemaShape = {
  body?: ZodTypeAny;
  querystring?: ZodTypeAny;
  response?: ZodTypeAny;
};

export type InferBody<S extends RouteSchemaShape> = S["body"] extends ZodTypeAny
  ? z.infer<S["body"]>
  : unknown;
export type InferQuery<S extends RouteSchemaShape> = S["querystring"] extends ZodTypeAny
  ? z.infer<S["querystring"]>
  : unknown;
export type InferResponse<S extends RouteSchemaShape> = S["response"] extends ZodTypeAny
  ? z.infer<S["response"]>
  : unknown;
