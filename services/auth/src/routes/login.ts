import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { login } from "../handlers/login";

const bodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const loginRoute = defineRoute({
  method: "POST",
  url: "/login",
  schema: { body: bodySchema },
  handler: ({ body }) => login(body),
});
