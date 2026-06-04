import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
});

export const changePasswordRoute = defineRoute({
  method: "POST",
  url: "/change-password",
  statusCode: 201,
  schema: {
    body: bodySchema,
    response: withErrorResponses(changePasswordResponseSchema, 201),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.changePassword({
      userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  },
});
