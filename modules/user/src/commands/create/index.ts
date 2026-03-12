import { createDb } from "@vassembly/commands";
import { validatorFactory } from "@vassembly/validation";
import { userMongodbDao } from "../../clients";
import { UserModel, userFactory } from "../../model";
import { CREATE_USER_VALIDATION_SCHEMA, PASSWORD_VALIDATION_SCHEMA } from "./constants";
import { CreateDbUserCommand } from "./types";


const validatePassword = validatorFactory(PASSWORD_VALIDATION_SCHEMA);
const createDbUser = createDb<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: CREATE_USER_VALIDATION_SCHEMA,
});

const hasValidPassword = async (data: CreateDbUserCommand) => {
  const { success, error } = await validatePassword(data);
  if (!success) {
    throw error;
  }
};

export const registerUser = async (data: CreateDbUserCommand) => {
  await hasValidPassword(data);

  const user = await createDbUser(data);
  return user;
};