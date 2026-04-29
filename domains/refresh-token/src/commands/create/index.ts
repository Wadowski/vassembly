import { createRefreshTokenDb } from "./createDb";
import { randomString, encode } from "@vassembly/client-encoder";
import type { CreateRefreshTokenInput } from "./types";
import { RefreshTokenModel } from "../../model";

const EXPIRES_IN = 1000 * 60 * 60 * 24 * 30; // 30 days

const getExpiresAt = () => {
  return new Date(Date.now() + EXPIRES_IN);
};

const getTokenHash = () => {
  const token = randomString(36);
  const tokenHash = encode(token);
  return { token, tokenHash };
};

export const create = async (input: CreateRefreshTokenInput): Promise<RefreshTokenModel> => {
  const expiresAt = getExpiresAt();
  const { token, tokenHash } = getTokenHash();
  const refreshToken = await createRefreshTokenDb({ ...input, expiresAt, tokenHash });
  refreshToken.data.token = token;
  return refreshToken.data;
};
