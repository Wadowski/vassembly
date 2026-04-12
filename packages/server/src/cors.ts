import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

export interface SetupCorsProps {
  fastify: FastifyInstance;
  allowedOrigins?: string[];
}

export const setupCors = async ({ fastify, allowedOrigins }: SetupCorsProps) => {
  await fastify.register(cors, {
    origin: allowedOrigins,
  });
};
