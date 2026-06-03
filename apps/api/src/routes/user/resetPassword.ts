import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export const userPublicResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const resetPasswordResponseSchema = z.object({
  user: userPublicResponseSchema,
});

export const resetPasswordRoute = defineRoute({
  method: "POST",
  url: "/reset-password",
  statusCode: 201,
  schema: {
    body: bodySchema,
    response: withErrorResponses(resetPasswordResponseSchema, 201),
  },
  handler: async ({ body }) => {
    const result = await handlers.resetPassword(body);
    return { user: result.user };
  },
});
