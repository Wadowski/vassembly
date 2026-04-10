import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const loginRoute = defineRoute({
  method: "POST",
  url: "/login",
  schema: { body: bodySchema },
  handler: ({ body }) => handlers.login(body),
});
