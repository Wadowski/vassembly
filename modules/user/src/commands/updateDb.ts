import { updateDbById } from "@vassembly/commands";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({
  email: z.email().optional(),
  passwordHash: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  verifiedAt: z.date().nullable().optional(),
});

export const updateDbUser = updateDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: VALIDATION_SCHEMA,
});
