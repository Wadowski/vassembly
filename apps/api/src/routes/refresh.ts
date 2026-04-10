import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { handlers } from "@vassembly/service-auth";

const bodySchema = z.object({
  refreshToken: z.string(),
});

export const refreshRoute = defineRoute({
  method: "POST",
  url: "/refresh",
  schema: { body: bodySchema },
  handler: ({ body }) => handlers.refresh(body),
});
