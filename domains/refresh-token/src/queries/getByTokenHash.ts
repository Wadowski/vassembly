import z from "zod";
import { getById } from "./getById";
import { refreshTokenMongodbDao } from "../clients";
import { RefreshTokenModel, refreshTokenFactory } from "../model";
import { NotFoundError } from "@vassembly/errors";

const VALIDATION_SCHEMA = z.object({
  tokenHash: z.string(),
});

export const getByTokenHash = async (tokenHash: string): Promise<ReturnType<typeof getById>> => {
  const queryInstance = refreshTokenFactory.create(
    { tokenHash },
    { validationSchema: VALIDATION_SCHEMA }
  );
  queryInstance.isValid({ shouldThrow: true });

  const daoResponse = await refreshTokenMongodbDao.get(queryInstance);

  if (!daoResponse) {
    throw new NotFoundError("Refresh token not found");
  }

  const refreshToken = refreshTokenFactory.create(daoResponse);
  return { data: refreshToken };
};
