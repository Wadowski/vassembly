import authTokenDomain from "@vassembly/domain-auth-token";
import refreshTokenDomain from "@vassembly/domain-refresh-token";
import { InternalError } from "@vassembly/errors";

import type { AuthInput } from "./types";

export const auth = async (input: AuthInput) => {
  const { authToken, refreshToken } = input;

  const verifiedToken = await authTokenDomain.queries.verify({ token: authToken });
  if (!verifiedToken.userId) {
    throw new InternalError("Failed to verify auth token");
  }

  const newRefreshToken = await refreshTokenDomain.commands.refresh({ refreshToken });

  return {
    authToken: verifiedToken,
    refreshToken: newRefreshToken.token,
  };
};

