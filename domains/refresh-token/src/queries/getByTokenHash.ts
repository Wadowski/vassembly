import z from "zod";
import { getListDbByQuery } from "@vassembly/queries";
import { getRefreshTokenById } from "./getById";
import { refreshTokenMongodbDao } from "../clients";
import { RefreshTokenModel, refreshTokenFactory } from "../model";
import { NotFoundError } from "@vassembly/errors";

const VALIDATION_SCHEMA = z.object({
  tokenHash: z.string(),
});

export const getRefreshTokenByTokenHashDb = getListDbByQuery<RefreshTokenModel>({
  dao: refreshTokenMongodbDao,
  factory: refreshTokenFactory,
  validationSchema: VALIDATION_SCHEMA,
});

export const getRefreshTokenByTokenHash = async (tokenHash: string): Promise<ReturnType<typeof getRefreshTokenById>> => {
  const { data } = await getRefreshTokenByTokenHashDb({ tokenHash });
  const [refreshToken] = data;
  
  if (!refreshToken) {
    throw new NotFoundError("Refresh token not found");
  }
  
  return { data: refreshToken };
};