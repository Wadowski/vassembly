import { z } from "zod";
import { describe, expect, it } from "vitest";

import { defineRoute } from "./defineRoute";

describe("defineRoute", () => {
  it("returns a route definition whose handler resolves with the handler output", async () => {
    const route = defineRoute({
      method: "GET",
      url: "/items",
      handler: async () => ({ count: 2 }),
    });

    expect(route.method).toBe("GET");
    expect(route.url).toBe("/items");
    const body = await route.handler({ body: undefined, query: {}, headers: {} });
    expect(body).toEqual({ count: 2 });
  });

  it("preserves optional schema on the returned definition", () => {
    const schema = {
      body: z.object({ id: z.string() }),
      response: z.object({ ok: z.boolean() }),
    };

    const route = defineRoute({
      method: "POST",
      url: "/submit",
      schema,
      handler: async ({ body }) => ({ ok: body.id === "a" }),
    });

    expect(route.schema).toBe(schema);
  });
});
