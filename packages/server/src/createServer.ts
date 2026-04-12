import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

import { applyFrameworkErrorHandler } from "./errorHandler";
import { setupGraphQL } from "./graphql/setup";
import { registerRoutes } from "./registerRoutes";
import { setupSwaggerUi } from "./swagger/setupSwaggerUi";
import { setupCors } from "./cors";
import type { ServerConfig } from "./types";
import { logger } from "./logger";

export const createServer = async (config: ServerConfig) => {
  const fastify = Fastify({
    logger,
  });

  await setupCors({ fastify, allowedOrigins: config.allowedOrigins });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  applyFrameworkErrorHandler({ fastify });

  await setupSwaggerUi({ fastify, serviceName: config.serviceName });

  if (config.graphql) {
    await setupGraphQL({ fastify, config: config.graphql });
  }

  if (config.routes && config?.routes?.length > 0) {
    await registerRoutes({ fastify, routes: config.routes });
  }

  return fastify;
};
