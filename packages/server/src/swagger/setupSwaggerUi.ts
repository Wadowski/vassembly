import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { createJsonSchemaTransform } from "fastify-type-provider-zod";

import type { SetupSwaggerUiProps } from "./types";

export const setupSwaggerUi = async ({ fastify, serviceName }: SetupSwaggerUiProps): Promise<void> => {
  const name = serviceName ?? "Vassembly";

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: `${name} API`,
        description: `${name} HTTP API documentation`,
        version: "0.0.0",
      },
      servers: [],
    },
    transform: createJsonSchemaTransform({
      skipList: ["/docs/static/*"],
    }),
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
  });
};
