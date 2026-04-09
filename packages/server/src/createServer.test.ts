import { NotFoundError } from "@vassembly/errors";
import { describe, expect, it } from "vitest";

import { createServer } from "./createServer";
import type { RouteDefinition } from "./types";

describe("createServer", () => {
  it("returns a Fastify instance", async () => {
    const app = await createServer({});
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
    await app.close();
  });

  it("serves Swagger UI at /docs", async () => {
    const app = await createServer({});
    const res = await app.inject({ method: "GET", url: "/docs" });

    expect(res.statusCode).toBe(200);
    expect(String(res.headers["content-type"])).toContain("text/html");
    await app.close();
  });

  it("registers configured routes", async () => {
    const routes: RouteDefinition[] = [
      {
        method: "GET",
        url: "/ping",
        handler: async () => ({ pong: true }),
      },
    ];
    const app = await createServer({ routes });
    const res = await app.inject({ method: "GET", url: "/ping" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ pong: true });
    await app.close();
  });

  it("skips route registration when routes are empty or omitted", async () => {
    const without = await createServer({});
    const empty = await createServer({ routes: [] });

    const r1 = await without.inject({ method: "GET", url: "/any" });
    const r2 = await empty.inject({ method: "GET", url: "/any" });

    expect(r1.statusCode).toBe(404);
    expect(r2.statusCode).toBe(404);
    await without.close();
    await empty.close();
  });

  it("responds with CommonError fields when a route throws CommonError", async () => {
    const routes: RouteDefinition[] = [
      {
        method: "GET",
        url: "/nf",
        handler: async () => {
          throw new NotFoundError("gone");
        },
      },
    ];
    const app = await createServer({ routes });
    const res = await app.inject({ method: "GET", url: "/nf" });
    const body = res.json() as { statusCode?: number; type?: string; message?: string };

    expect(res.statusCode).toBe(404);
    expect(body.type).toBe("NOT_FOUND");
    expect(body.message).toBe("gone");
    await app.close();
  });

  it("responds with InternalError shape when a route throws a non-CommonError", async () => {
    const routes: RouteDefinition[] = [
      {
        method: "GET",
        url: "/boom",
        handler: async () => {
          throw new Error("do not leak");
        },
      },
    ];
    const app = await createServer({ routes });
    const res = await app.inject({ method: "GET", url: "/boom" });
    const body = res.json() as { type?: string; message?: string };

    expect(res.statusCode).toBe(500);
    expect(body.type).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("Internal Server Error");
    await app.close();
  });
});
