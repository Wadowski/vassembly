import { getDbById } from "@vassembly/queries";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";

export const getUserById = getDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});