import type { FastifyInstance, FastifyRequest, RouteHandlerMethod, FastifySchema } from "fastify";

import type { HTTPMethod, RegisterFn, RegisterRoutesProps, RouteDefinition } from "./types";

const toHeaderRecord = (headers: FastifyRequest["headers"]): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key of Object.keys(headers)) {
    const value = headers[key];
    if (value === undefined) {
      continue;
    }
    result[key] = Array.isArray(value) ? (value[0] ?? "") : value;
  }
  return result;
};

const getMethodRegister = ({ fastify }: { fastify: FastifyInstance }): Record<HTTPMethod, RegisterFn> => ({
  GET: (path, opts, handler) => fastify.get(path, opts, handler),
  POST: (path, opts, handler) => fastify.post(path, opts, handler),
  PUT: (path, opts, handler) => fastify.put(path, opts, handler),
  PATCH: (path, opts, handler) => fastify.patch(path, opts, handler),
  DELETE: (path, opts, handler) => fastify.delete(path, opts, handler),
});

const toFastifySchema = (schema: NonNullable<RouteDefinition["schema"]>): FastifySchema => {
  const result: FastifySchema = {};

  if (schema.body !== undefined) {
    result.body = schema.body;
  }
  if (schema.querystring !== undefined) {
    result.querystring = schema.querystring;
  }
  if (schema.response !== undefined) {
    result.response = { 200: schema.response };
  }

  return result;
};

const buildRoutePath = ({ prefix, url }: RouteDefinition): string => {
  if (prefix === undefined || prefix === "") {
    return url;
  }
  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  const normalizedPath = `${normalizedPrefix}${normalizedUrl}`;
  const pathWithoutTrailingSlash = normalizedPath.endsWith("/") ? normalizedPath.slice(0, -1) : normalizedPath;
  return pathWithoutTrailingSlash;
};

export const registerRoutes = async ({ fastify, routes }: RegisterRoutesProps): Promise<void> => {
  const registerByMethod = getMethodRegister({ fastify });

  for (const route of routes) {
    const register = registerByMethod[route.method];
    const opts = {
      schema: route.schema ? toFastifySchema(route.schema) : undefined,
    };

    const handler: RouteHandlerMethod = async (request, reply) => {
      const result = await route.handler({
        body: request.body,
        query: request.query,
        headers: toHeaderRecord(request.headers),
        params: request.params as Record<string, string> | undefined,
      });
      const statusCode = route.statusCode ?? 200;
      return reply.code(statusCode).send(result);
    };

    register(buildRoutePath(route), opts, handler);
  }
};
