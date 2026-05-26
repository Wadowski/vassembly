import userDomain from "@vassembly/domain-user";
import { AUTH_TOKEN_ROLE } from "@vassembly/constants";

import { authorizeRequest } from "../authorizeRequest";

import type { AuthorizeAdminRequestInput, AuthorizeAdminRequestOutput } from "./types";

export const authorizeAdminRequest = async (
  input: AuthorizeAdminRequestInput,
): Promise<AuthorizeAdminRequestOutput> => {
  const { userId } = await authorizeRequest(input);

  await userDomain.queries.assertHasRole({ userId, role: AUTH_TOKEN_ROLE.ADMIN });

  return { userId, role: AUTH_TOKEN_ROLE.ADMIN };
};
