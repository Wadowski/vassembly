import userDomain from "@vassembly/domain-user";
import * as refreshTokenDomain from "@vassembly/domain-refresh-token";
import * as authTokenDomain from "@vassembly/domain-auth-token";
import { AUTH_TOKEN_ROLE } from "@vassembly/constants";
import { InternalError } from "@vassembly/errors";

import type { RegisterInput, RegisterOutput } from "./types";

export const register = async (input: RegisterInput): Promise<RegisterOutput> => {
  const { email, password, firstName, lastName } = input;

  const user = await userDomain.commands.create({ email, password, firstName, lastName });
  if (!user.data.id) {
    throw new InternalError("Failed to create user");
  }

  const role = user.data.role ?? AUTH_TOKEN_ROLE.USER;

  const refreshToken = await refreshTokenDomain.commands.create({ userId: user.data.id });
  if (!refreshToken.id || !refreshToken.token) {
    throw new InternalError("Failed to create refresh token");
  }

  const authToken = await authTokenDomain.commands.create({
    input: { userId: user.data.id, refreshTokenId: refreshToken.id, role },
  });
  if (!authToken.token) {
    throw new InternalError("Failed to create auth token");
  }

  return {
    user: user.data,
    authToken: authToken.token,
    refreshToken: refreshToken.token,
  };
};
