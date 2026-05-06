import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export const resetPasswordRoute = defineRoute({
  method: "POST",
  url: "/reset-password",
  schema: { body: bodySchema },
  handler: async ({ body }) => {
    const result = await handlers.resetPassword(body);
    return { user: result.user };
  },
});
