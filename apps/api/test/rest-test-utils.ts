import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { applyFrameworkErrorHandler, registerRoutes } from '@vassembly/server';
import type { RouteDefinition } from '@vassembly/server';

export interface CreateMcpConfigTestServerParams {
  routes: RouteDefinition[];
  prefix?: string;
}

export const createMcpConfigTestServer = async ({
  routes,
  prefix = '/mcps',
}: CreateMcpConfigTestServerParams): Promise<ReturnType<typeof Fastify>> => {
  const fastify = Fastify();
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  applyFrameworkErrorHandler({ fastify });

  const prefixedRoutes = routes.map((route) => ({
    ...route,
    url: `${prefix}${route.url}`,
  }));

  await registerRoutes({ fastify, routes: prefixedRoutes });
  return fastify;
};

export interface InjectMcpConfigRequestParams {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  routes: RouteDefinition[];
  headers?: Record<string, string>;
  payload?: unknown;
}

export const injectMcpConfigRequest = async ({
  method,
  url,
  routes,
  headers,
  payload,
}: InjectMcpConfigRequestParams): Promise<Awaited<ReturnType<ReturnType<typeof Fastify>['inject']>>> => {
  const fastify = await createMcpConfigTestServer({ routes });
  const response = await fastify.inject({
    method,
    url,
    headers,
    payload,
  });
  await fastify.close();
  return response;
};
