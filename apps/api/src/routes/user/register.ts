import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

const bodySchema = z.object({
  email: z.string(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const userPublicResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const registerResponseSchema = z.object({
  user: userPublicResponseSchema,
  authToken: z.string(),
  refreshToken: z.string(),
});

export const registerRoute = defineRoute({
  method: "POST",
  url: "/register",
  statusCode: 201,
  schema: {
    body: bodySchema,
    response: withErrorResponses(registerResponseSchema, 201),
  },
  handler: ({ body }) => handlers.register(body),
});
