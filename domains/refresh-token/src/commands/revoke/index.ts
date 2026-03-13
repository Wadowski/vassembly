import { hash } from "@vassembly/client-encoder";
import { updateRefreshToken } from "../updateDb";
import { getRefreshTokenByTokenHash } from '../../queries';
import type { RevokeRefreshTokenInput } from "./types";
import { NotFoundError } from "@vassembly/errors";

export const revokeRefreshToken = async (input: RevokeRefreshTokenInput) => {
  const { refreshToken: tokenString } = input;
  const tokenHash = hash(tokenString);
  const refreshTokenDb = await getRefreshTokenByTokenHash(tokenHash);
  if (!refreshTokenDb.data.id) {
    throw new NotFoundError("Refresh token not found");
  }

  const refreshTokenUpdated = await updateRefreshToken({ 
    id: refreshTokenDb.data.id, 
    data: { revokedAt: new Date() },
  });

  return refreshTokenUpdated;
};
