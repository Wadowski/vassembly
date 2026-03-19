import { jwtClient } from "../../clients";
import type { DecodeAuthTokenInput, DecodeAuthTokenResult } from "./types";
import { authTokenFactory } from "../../model";

export const decodeAuthToken = async ({ token }: DecodeAuthTokenInput): Promise<DecodeAuthTokenResult> => {
  const decoded = await jwtClient.decode(token);

  if (!decoded) {
    return null;
  }
  
  const result = authTokenFactory.create({
    role: decoded.role as string,
    userId: decoded.sub as string,
    refreshTokenId: decoded.jti as string,
    expiresAt: new Date(decoded.expiresAt as number),
    createdAt: new Date(decoded.iat as number),
  });

  return result;
};
