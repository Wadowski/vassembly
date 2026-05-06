import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine(
    (data) => data.firstName !== undefined || data.lastName !== undefined,
    { message: "At least one of first name or last name is required" },
  );

export const updateProfileRoute = defineRoute({
  method: "PATCH",
  url: "/profile",
  schema: { body: bodySchema },
  handler: async ({ body, headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.updateUserProfile({
      userId,
      firstName: body.firstName,
      lastName: body.lastName,
    });
  },
});
