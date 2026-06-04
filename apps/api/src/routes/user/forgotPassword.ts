import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

const bodySchema = z.object({
  email: z.email(),
});

export const forgotPasswordResponseSchema = z.object({
  message: z.string(),
});

export const forgotPasswordRoute = defineRoute({
  method: "POST",
  url: "/forgot-password",
  statusCode: 201,
  schema: {
    body: bodySchema,
    response: withErrorResponses(forgotPasswordResponseSchema, 201),
  },
  handler: ({ body }): Promise<{ message: string }> => handlers.forgotPassword(body),
});
