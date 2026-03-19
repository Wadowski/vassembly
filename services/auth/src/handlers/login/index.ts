import userDomain from "@vassembly/domain-user";
import refreshTokenDomain from "@vassembly/domain-refresh-token";
import authTokenDomain from "@vassembly/domain-auth-token";
import { InternalError } from "@vassembly/errors";

import type { LoginInput } from "./types";

export const login = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await userDomain.queries.verify({ email, password });
  if (!user.id) {
    throw new InternalError("Failed to verify credentials");
  }
  const refreshToken = await refreshTokenDomain.commands.create({ userId: user.id });
  if (!refreshToken.id) {
    throw new InternalError("Failed to create refresh token");
  }
  const authToken = await authTokenDomain.commands.create({ 
    input: { userId: user.id, refreshTokenId: refreshToken.id, role: 'user' }
  });

  return {
    user,
    authToken: authToken.token,
    refreshToken: refreshToken.token,
  };
};
