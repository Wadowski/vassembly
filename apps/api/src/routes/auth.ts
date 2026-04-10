import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z.object({
  authToken: z.string(),
  refreshToken: z.string(),
});

export const authRoute = defineRoute({
  method: "POST",
  url: "/auth",
  schema: { body: bodySchema },
  handler: ({ body }) => handlers.auth(body),
});
