import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { auth } from "../handlers/auth";

const bodySchema = z.object({
  authToken: z.string(),
  refreshToken: z.string(),
});

export const authRoute = defineRoute({
  method: "POST",
  url: "/auth",
  schema: { body: bodySchema },
  handler: ({ body }) => auth(body),
});
