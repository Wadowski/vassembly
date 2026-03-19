import { jwtClient } from "../../clients";
import type { CreateAuthTokenArgs, AuthTokenResponse } from "./types";
import { authTokenFactory } from "../../model";

const EXPIRES_IN = 1000 * 60 * 15; // 15 minutes

export const createAuthToken = async ({ input, options }: CreateAuthTokenArgs): AuthTokenResponse => {

  const data = authTokenFactory.create({
    role: input.role,
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
