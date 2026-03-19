import { verifyCredentials } from "@vassembly/domain-user";
import { createRefreshToken } from "@vassembly/domain-refresh-token";
import { createAuthToken } from "@vassembly/domain-auth-token";

import type { LoginInput } from "./types";

export const login = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await verifyCredentials({ email, password });
  const refreshToken = await createRefreshToken({ userId: user.id });
  const authToken = await createAuthToken({ 
    input: { userId: user.id, refreshTokenId: refreshToken.id, role: 'user' }
  });

  return {
    user,
    authToken: authToken.token,
    refreshToken: refreshToken.token,
  };
};
