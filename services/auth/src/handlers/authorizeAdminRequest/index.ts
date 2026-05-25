import { ForbiddenError } from "@vassembly/errors";

import { authorizeRequest } from "../authorizeRequest";

import type { AuthorizeAdminRequestInput, AuthorizeAdminRequestOutput } from "./types";

export const authorizeAdminRequest = async (
  input: AuthorizeAdminRequestInput,
): Promise<AuthorizeAdminRequestOutput> => {
  const { userId, role } = await authorizeRequest(input);

  if (role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }

  return { userId, role: "admin" };
};
