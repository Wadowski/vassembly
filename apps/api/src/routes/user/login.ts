import { AUTH_TOKEN_ROLE } from "@vassembly/constants";
import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

const bodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const userPublicResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(AUTH_TOKEN_ROLE).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const loginResponseSchema = z.object({
  user: userPublicResponseSchema,
  authToken: z.string(),
  refreshToken: z.string(),
});

export const loginRoute = defineRoute({
  method: "POST",
  url: "/login",
  statusCode: 201,
  schema: {
    body: bodySchema,
    response: withErrorResponses(loginResponseSchema, 201),
  },
  handler: ({ body }) => handlers.login(body),
});
