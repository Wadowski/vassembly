import { CommonError, InternalError } from "@vassembly/errors";
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

import { setupGraphQL } from "./graphql/setup";
import { registerRoutes } from "./registerRoutes";
import type { ServerConfig } from "./types";

const errorHandler = (err: unknown, _request: FastifyRequest, reply: FastifyReply) => {
  const error = err instanceof CommonError ? err : new InternalError("Internal Server Error");
  
  return reply.status(error.statusCode).send({
    type: error.type,
    message: error.message,
    error: error.error,
    });
};

export const createServer = async (config: ServerConfig) => {
  const fastify = Fastify();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.setErrorHandler((error, _request, reply) => {
    return errorHandler(error, _request, reply);
  });

  if (config.graphql) {
    await setupGraphQL({ fastify, config: config.graphql });
  }

  if (config.routes && config?.routes?.length > 0) {
    await registerRoutes({ fastify, routes: config.routes });
  }

  return fastify;
};
