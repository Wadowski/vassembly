import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z.object({
  email: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const registerRoute = defineRoute({
  method: "POST",
  url: "/register",
  schema: { body: bodySchema },
  handler: ({ body }) => handlers.register(body),
});
