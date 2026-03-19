import z from "zod";
import { getListDbByQuery } from "@vassembly/queries";
import { getById } from "./getById";
import { refreshTokenMongodbDao } from "../clients";
import { RefreshTokenModel, refreshTokenFactory } from "../model";
import { NotFoundError } from "@vassembly/errors";

const VALIDATION_SCHEMA = z.object({
  tokenHash: z.string(),
});

export const getByTokenHashDb = getListDbByQuery<RefreshTokenModel>({
  dao: refreshTokenMongodbDao,
  factory: refreshTokenFactory,
  validationSchema: VALIDATION_SCHEMA,
});

export const getByTokenHash = async (tokenHash: string): Promise<ReturnType<typeof getById>> => {
  const { data } = await getByTokenHashDb({ tokenHash });
  const [refreshToken] = data;
  
  if (!refreshToken) {
    throw new NotFoundError("Refresh token not found");
  }
  
  return { data: refreshToken };
};