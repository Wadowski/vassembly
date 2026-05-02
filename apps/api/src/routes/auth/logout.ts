import { defineRoute } from "@vassembly/server";
import { CUSTOM_HEADERS } from "@vassembly/constants";

import { handlers } from "@vassembly/service-auth";

export const logoutRoute = defineRoute({
  method: "POST",
  url: "/logout",
  handler: ({ headers }) => {
    const { [CUSTOM_HEADERS.AuthToken]: authToken = '', [CUSTOM_HEADERS.RefreshToken]: refreshToken = '' } = headers;
    return handlers.logout({ authToken, refreshToken });
  },
});
