import { AUTH_TOKEN_ROLE } from "@vassembly/constants";

import { jwtClient } from "../../clients";
import { authTokenFactory } from "../../model";
import type { CreateAuthTokenArgs, AuthTokenResponse } from "./types";

const EXPIRES_IN = 1000 * 60 * 15; // 15 minutes

export const create = async ({ input, options }: CreateAuthTokenArgs): AuthTokenResponse => {

  const data = authTokenFactory.create({
    role: AUTH_TOKEN_ROLE[input.role.toUpperCase() as keyof typeof AUTH_TOKEN_ROLE],
    userId: input.userId,
    refreshTokenId: input.refreshTokenId,
    expiresAt: new Date(Date.now() + EXPIRES_IN),
    createdAt: new Date(),
  });

  const token = await jwtClient.create({
    data: {
      sub: data.userId,
      role: data.role,
      jti: data.refreshTokenId,
      exp: data.expiresAt?.getTime(),
      iat: data.createdAt?.getTime(),
    },
    options,
  });

  const response = authTokenFactory.create({
    ...data,
    token,
  });

  return response;
};
