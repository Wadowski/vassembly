import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

export interface SetupCorsProps {
  fastify: FastifyInstance;
  allowedOrigins?: string[];
}

const CORS_ALLOWED_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] as const;

export const setupCors = async ({ fastify, allowedOrigins }: SetupCorsProps): Promise<void> => {
  await fastify.register(cors, {
    methods: [...CORS_ALLOWED_METHODS],
    ...(allowedOrigins !== undefined ? { origin: allowedOrigins } : {}),
  });
};
