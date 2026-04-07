import type { FastifyInstance } from "fastify";

export interface SetupSwaggerUiProps {
  fastify: FastifyInstance;
  serviceName?: string;
}
