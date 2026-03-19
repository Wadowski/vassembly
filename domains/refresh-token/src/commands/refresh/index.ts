import { hash } from "@vassembly/client-encoder";
import { create } from "../create";
import { update } from "../updateDb";
import { getByTokenHash } from "../../queries/getByTokenHash";
import type { RefreshRefreshTokenInput } from "./types";
import { NotFoundError, WrongParamError } from "@vassembly/errors";
import type { RefreshTokenModel } from "../../model";

const EXPIRATION_GRACE_PERIOD = 30 * 1000;

export const refresh = async (input: RefreshRefreshTokenInput): Promise<RefreshTokenModel> => {
  const { refreshToken: tokenString } = input;
  const tokenHash = hash(tokenString);
  const refreshTokenDb = await getByTokenHash(tokenHash);
  
  if (!refreshTokenDb.data.id) {
    throw new NotFoundError("Refresh token not found");
  }

  const now = new Date();
  const { id, userId, expiresAt, revokedAt } = refreshTokenDb.data;
  
  if (revokedAt) {
    throw new WrongParamError("Refresh token is revoked");
  }

  if (expiresAt && expiresAt.getTime() + EXPIRATION_GRACE_PERIOD < now.getTime()) {
    throw new WrongParamError("Refresh token is expired");
  }

  const newToken = await create({ userId: userId! });
  
  await update({
    id,
    data: { replacedByRefreshTokenId: newToken.id, revokedAt: now },
  });

  return newToken;
};
