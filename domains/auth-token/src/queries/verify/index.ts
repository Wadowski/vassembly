import { jwtClient } from "../../clients";
import type { VerifyAuthTokenInput, VerifyAuthTokenResult } from "./types";
import { authTokenFactory, AuthTokenRole } from "../../model";
import { ForbiddenError } from "@vassembly/errors";

export const verify = async ({ token, options }: VerifyAuthTokenInput): VerifyAuthTokenResult => {
  const decoded = await jwtClient.verify({ token, options });

  if (!decoded.role || !decoded.sub || !decoded.jti || !decoded.exp || !decoded.iat) {
    throw new ForbiddenError("Invalid token structure");
  }

  const result = authTokenFactory.create({
    role: decoded.role as AuthTokenRole,
    userId: decoded.sub as string,
    refreshTokenId: decoded.jti as string,
    expiresAt: new Date(decoded.exp as number),
    createdAt: new Date(decoded.iat as number),
  });
  return result;
};
