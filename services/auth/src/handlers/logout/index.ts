import * as authTokenDomain from "@vassembly/domain-auth-token";
import * as refreshTokenDomain from "@vassembly/domain-refresh-token";
import { InternalError } from "@vassembly/errors";

import type { LogoutInput, LogoutOutput } from "./types";

export const logout = async (input: LogoutInput): Promise<LogoutOutput> => {
  const { authToken, refreshToken } = input;

  const verifiedToken = await authTokenDomain.queries.verify({ token: authToken });
  if (!verifiedToken.userId || !verifiedToken.refreshTokenId) {
    throw new InternalError("Failed to verify auth token");
  }

  await refreshTokenDomain.commands.revoke({ refreshToken });

  return { ok: true };
};
