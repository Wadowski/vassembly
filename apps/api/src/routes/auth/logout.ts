import { defineRoute } from "@vassembly/server";
import { z } from "zod";
import { CUSTOM_HEADERS } from "@vassembly/constants";

import { handlers } from "@vassembly/service-auth";
import { withErrorResponses } from "../errorSchema";

export const logoutResponseSchema = z.object({
  ok: z.boolean(),
});

export const logoutRoute = defineRoute({
  method: "POST",
  url: "/logout",
  statusCode: 201,
  schema: {
    response: withErrorResponses(logoutResponseSchema, 201),
  },
  handler: ({ headers }) => {
    const { [CUSTOM_HEADERS.AuthToken]: authToken = '', [CUSTOM_HEADERS.RefreshToken]: refreshToken = '' } = headers;
    return handlers.logout({ authToken, refreshToken });
  },
});
