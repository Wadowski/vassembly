import { defineRoute } from "@vassembly/server";

import { handlers } from "@vassembly/service-auth";

export const deleteAccountRoute = defineRoute({
  method: "POST",
  url: "/delete-account",
  handler: async ({ headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.deleteAccount({ userId });
  },
});
