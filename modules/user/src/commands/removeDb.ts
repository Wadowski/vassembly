import { removeDb } from "@vassembly/commands";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";

export const removeDbUser = removeDb<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});
