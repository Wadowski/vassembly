import { AUTH_TOKEN_ROLE } from "@vassembly/constants";
import { ForbiddenError } from "@vassembly/errors";

import { jwtClient } from "../../clients";
import { authTokenFactory } from "../../model";
import type { VerifyAuthTokenInput, VerifyAuthTokenResult } from "./types";

export const verify = async ({ token, options }: VerifyAuthTokenInput): VerifyAuthTokenResult => {
  const decoded = await jwtClient.verify({ token, options });

  if (!decoded.role || !decoded.sub || !decoded.jti || !decoded.exp || !decoded.iat) {
    throw new ForbiddenError("Invalid token structure");
  }

  const onboardingCompleted =
    decoded.onb === undefined ? true : decoded.onb !== false;

  const result = authTokenFactory.create({
    role: decoded.role as AUTH_TOKEN_ROLE,
    userId: decoded.sub as string,
    refreshTokenId: decoded.jti as string,
    expiresAt: new Date(decoded.exp as number),
    createdAt: new Date(decoded.iat as number),
    onboardingCompleted,
  });
  return result;
};
