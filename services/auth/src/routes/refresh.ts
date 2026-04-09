import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { refresh } from "../handlers/refresh";

const bodySchema = z.object({
  refreshToken: z.string(),
});

export const refreshRoute = defineRoute({
  method: "POST",
  url: "/refresh",
  schema: { body: bodySchema },
  handler: ({ body }) => refresh(body),
});
