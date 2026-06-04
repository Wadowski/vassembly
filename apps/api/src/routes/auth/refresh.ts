import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

const bodySchema = z.object({
  refreshToken: z.string(),
});

export const refreshResponseSchema = z.object({
  authToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const refreshRoute = defineRoute({
  method: "POST",
  url: "/refresh",
  statusCode: 201,
  schema: {
    body: bodySchema,
    response: withErrorResponses(refreshResponseSchema, 201),
  },
  handler: ({ body }) => handlers.refresh(body),
});
