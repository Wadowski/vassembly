import { encode } from "@vassembly/client-encoder";
import { update } from "../updateDb";
import { getByTokenHash } from '../../queries';
import type { RevokeRefreshTokenInput } from "./types";
import { NotFoundError, WrongParamError } from "@vassembly/errors";

export const revoke = async (input: RevokeRefreshTokenInput) => {
  const { refreshToken: tokenString } = input;
  const normalizedToken = tokenString.trim();
  if (!normalizedToken) {
    throw new WrongParamError("Refresh token is required");
  }
  const tokenHash = encode(normalizedToken);
  const refreshTokenDb = await getByTokenHash(tokenHash);
  if (!refreshTokenDb.data.id) {
    throw new NotFoundError("Refresh token not found");
  }

  const refreshTokenUpdated = await update({ 
    id: refreshTokenDb.data.id, 
    data: { revokedAt: new Date() },
  });

  return refreshTokenUpdated;
};
