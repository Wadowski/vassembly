import refreshTokenDomain from "@vassembly/domain-refresh-token";

import type { RefreshInput } from "./types";

export const refresh = async (input: RefreshInput) => {
  const { refreshToken } = input;

  const newRefreshToken = await refreshTokenDomain.commands.refresh({ refreshToken });

  return newRefreshToken;
};
