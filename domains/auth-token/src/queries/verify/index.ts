import { jwtClient } from "../../clients";
import type { VerifyAuthTokenInput, VerifyAuthTokenResult } from "./types";
import { authTokenFactory } from "../../model";
import { ForbiddenError } from "@vassembly/errors";

export const verifyAuthToken = async ({ token, options }: VerifyAuthTokenInput): VerifyAuthTokenResult => {
  const decoded = await jwtClient.verify({ token, options });

  if (!decoded.role && !decoded.userId && !decoded.jti && !decoded.expiresAt && !decoded.issuedAt) {
    throw new ForbiddenError("Invalid token");
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
