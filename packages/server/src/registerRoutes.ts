import type { FastifyInstance, RouteHandlerMethod, FastifySchema } from "fastify";

import type { HTTPMethod, RegisterFn, RegisterRoutesProps, RouteDefinition } from "./types";

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

export const registerRoutes = async ({ fastify, routes }: RegisterRoutesProps): Promise<void> => {
  const registerByMethod = getMethodRegister({ fastify });

  for (const route of routes) {
    const register = registerByMethod[route.method];
    const opts = { 
      schema: route.schema ? toFastifySchema(route.schema) : undefined,
      prefix: route.prefix,
    };

    const handler: RouteHandlerMethod = async (request, reply) => {
      const result = await route.handler({
        body: request.body,
        query: request.query,
      });
      return reply.send(result);
    };

    register(route.url, opts, handler);
  }
};
