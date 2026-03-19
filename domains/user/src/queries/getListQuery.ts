import { getListDbByQuery } from "@vassembly/queries";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";
import z from "zod";

const VALIDATION_SCHEMA = z.object({
  email: z.email().optional(),
});

export const getListByQuery = getListDbByQuery<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: VALIDATION_SCHEMA,
});