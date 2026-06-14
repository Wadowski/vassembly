import userDomain from "@vassembly/domain-user";
import * as refreshTokenDomain from "@vassembly/domain-refresh-token";
import * as authTokenDomain from "@vassembly/domain-auth-token";
import { AUTH_TOKEN_ROLE } from "@vassembly/constants";
import { InternalError } from "@vassembly/errors";

import type { LoginInput, LoginOutput } from "./types";

export const login = async (input: LoginInput): Promise<LoginOutput> => {
  const { email, password } = input;

  const user = await userDomain.queries.verify({ email, password });
  if (!user.id) {
    throw new InternalError("Failed to verify credentials");
  }

  const role = user.role ?? AUTH_TOKEN_ROLE.USER;

  const refreshToken = await refreshTokenDomain.commands.create({ userId: user.id });
  if (!refreshToken.id || !refreshToken.token) {
    throw new InternalError("Failed to create refresh token");
  }

  const authToken = await authTokenDomain.commands.create({
    input: { userId: user.id, refreshTokenId: refreshToken.id, role },
  });
  if (!authToken.token) {
    throw new InternalError("Failed to create auth token");
  }

  return {
    user,
    authToken: authToken.token,
    refreshToken: refreshToken.token,
  };
};
