import { getDbById } from "@vassembly/queries";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";

export const getById = getDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});