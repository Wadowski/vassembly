import userDomain from "@vassembly/domain-user";
import { NotFoundError } from "@vassembly/errors";

import type { GetUserInput } from "./types";

export const getUser = async (input: GetUserInput) => {
  const { id } = input;

  const user = await userDomain.queries.getById({ id });
  if (!user.data) {
    throw new NotFoundError("User not found");
  }

  return { user: user.data };
};
