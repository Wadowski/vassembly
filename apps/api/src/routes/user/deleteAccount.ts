import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

export const deleteAccountResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteAccountRoute = defineRoute({
  method: "POST",
  url: "/delete-account",
  statusCode: 201,
  schema: {
    response: withErrorResponses(deleteAccountResponseSchema, 201),
  },
  handler: async ({ headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.deleteAccount({ userId });
  },
});
