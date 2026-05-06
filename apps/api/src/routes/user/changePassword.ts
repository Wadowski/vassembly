import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export const changePasswordRoute = defineRoute({
  method: "POST",
  url: "/change-password",
  schema: { body: bodySchema },
  handler: async ({ body, headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.changePassword({
      userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  },
});
