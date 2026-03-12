import { createDb } from "@vassembly/commands";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({
  email: z.email(),
  passwordHash: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  verifiedAt: z.date().nullable().optional(),
});

export const createDbUser = createDb<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: VALIDATION_SCHEMA,
});
