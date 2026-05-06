import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z.object({
  email: z.email(),
});

export const forgotPasswordRoute = defineRoute({
  method: "POST",
  url: "/forgot-password",
  schema: { body: bodySchema },
  handler: ({ body }): Promise<{ message: string }> => handlers.forgotPassword(body),
});
