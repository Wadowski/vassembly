import { getDbById } from "@vassembly/queries";
import { refreshTokenMongodbDao } from "../clients";
import { RefreshTokenModel, refreshTokenFactory } from "../model";

export const getById = getDbById<RefreshTokenModel>({
  dao: refreshTokenMongodbDao,
  factory: refreshTokenFactory,
});