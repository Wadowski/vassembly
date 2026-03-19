import { updateDbById } from "@vassembly/commands";
import { refreshTokenMongodbDao } from "../clients";
import { RefreshTokenModel, refreshTokenFactory } from "../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({
  revokedAt: z.date().optional(),
  replacedByRefreshTokenId: z.string().optional(),
});

export const update = updateDbById<RefreshTokenModel>({
  dao: refreshTokenMongodbDao,
  factory: refreshTokenFactory,
  validationSchema: VALIDATION_SCHEMA,
});
