import { createUser } from "@vassembly/domain-user";
import { createRefreshToken } from "@vassembly/domain-refresh-token";

import type { RegisterInput } from "./types";

export const register = async (input: RegisterInput) => {
  const { email, password, confirmPassword, firstName, lastName } = input;
  
  const user = await createUser({ email, password, confirmPassword, firstName, lastName });
  const refreshToken = await createRefreshToken({ userId: user.data.id });
  
  return { user: user.data, refreshToken: refreshToken.data };
};