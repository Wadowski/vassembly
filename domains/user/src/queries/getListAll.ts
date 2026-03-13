import { getListDbByQuery } from "@vassembly/queries";
import { userMongodbDao } from "../clients";
import { UserModel, userFactory } from "../model";

export const getListAllUsers = getListDbByQuery<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});