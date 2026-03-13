import { updateDbById } from "@vassembly/commands";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  verifiedAt: z.date().optional(),
});

export const updateUser = updateDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: VALIDATION_SCHEMA,
});
