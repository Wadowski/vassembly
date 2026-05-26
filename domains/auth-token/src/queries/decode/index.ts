import type { AUTH_TOKEN_ROLE } from "@vassembly/constants";

import { jwtClient } from "../../clients";
import { authTokenFactory } from "../../model";
import type { DecodeAuthTokenInput, DecodeAuthTokenResult } from "./types";

export const decode = async ({ token }: DecodeAuthTokenInput): Promise<DecodeAuthTokenResult> => {
  const decoded = await jwtClient.decode(token);

  if (!decoded) {
    return null;
  }
  
  const result = authTokenFactory.create({
    role: decoded.role as AUTH_TOKEN_ROLE,
    userId: decoded.sub as string,
    refreshTokenId: decoded.jti as string,
    expiresAt: new Date(decoded.expiresAt as number),
    createdAt: new Date(decoded.iat as number),
  });

  return result;
};
