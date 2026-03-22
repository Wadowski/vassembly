import { createDb } from "@vassembly/commands";
import { refreshTokenMongodbDao } from "../../clients";
import { RefreshTokenModel, refreshTokenFactory } from "../../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({
  userId: z.string(),
  tokenHash: z.string(),
  expiresAt: z.date(),
  description: z.string().optional(),
});

export const createRefreshTokenDb = createDb<RefreshTokenModel>({
  dao: refreshTokenMongodbDao,
  factory: refreshTokenFactory,
  validationSchema: VALIDATION_SCHEMA,
});
