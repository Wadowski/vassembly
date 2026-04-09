import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { z } from "zod";
import { describe, expect, it } from "vitest";

import { applyFrameworkErrorHandler } from "./errorHandler";
import { registerRoutes } from "./registerRoutes";
import type { RouteDefinition } from "./types";

describe("registerRoutes", () => {
  it("registers a GET route that returns the handler payload", async () => {
    const fastify = Fastify();
    const routes: RouteDefinition[] = [
      {
        method: "GET",
        url: "/hello",
        handler: async () => ({ message: "hi" }),
      },
    ];

    await registerRoutes({ fastify, routes });
    const res = await fastify.inject({ method: "GET", url: "/hello" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: "hi" });
    await fastify.close();
  });

  it("registers a POST route and passes body and query to the handler", async () => {
    const fastify = Fastify();
    const routes: RouteDefinition[] = [
      {
        method: "POST",
        url: "/echo",
        handler: async ({ body, query }) => ({
          seenBody: body,
          seenQuery: query,
        }),
      },
    ];

    await registerRoutes({ fastify, routes });
    const res = await fastify.inject({
      method: "POST",
      url: "/echo?q=1",
      payload: { n: 3 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      seenBody: { n: 3 },
      seenQuery: { q: "1" },
    });
    await fastify.close();
  });

  it("applies zod schema to Fastify when schema is provided", async () => {
    const fastify = Fastify();
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);
    applyFrameworkErrorHandler({ fastify });
    const routes: RouteDefinition[] = [
      {
        method: "POST",
        url: "/num",
        schema: {
          body: z.object({ n: z.number() }),
          response: z.object({ doubled: z.number() }),
        },
        handler: async ({ body }) => ({ doubled: (body as { n: number }).n * 2 }),
      },
    ];

    await registerRoutes({ fastify, routes });
    const ok = await fastify.inject({ method: "POST", url: "/num", payload: { n: 5 } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toEqual({ doubled: 10 });

    const bad = await fastify.inject({ method: "POST", url: "/num", payload: {} });
    expect(bad.statusCode).toBe(400);

    await fastify.close();
  });
});
