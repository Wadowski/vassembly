import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

const bodySchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine(
    (data) => data.firstName !== undefined || data.lastName !== undefined,
    { message: "At least one of first name or last name is required" },
  );

export const userPublicResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const updateProfileResponseSchema = z.object({
  user: userPublicResponseSchema,
});

export const updateProfileRoute = defineRoute({
  method: "PATCH",
  url: "/profile",
  schema: {
    body: bodySchema,
    response: withErrorResponses(updateProfileResponseSchema),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.updateUserProfile({
      userId,
      firstName: body.firstName,
      lastName: body.lastName,
    });
  },
});
