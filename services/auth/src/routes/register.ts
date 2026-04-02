import { defineRoute } from "@vassembly/server";
import { z } from "zod";

import { register } from "../handlers/register";

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
  handler: ({ body }) => register(body),
});
