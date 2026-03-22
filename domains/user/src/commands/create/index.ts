import bcrypt from "bcryptjs";
import { createDb } from "@vassembly/commands";
import { validatorFactory } from "@vassembly/validation";
import { WrongParamError } from "@vassembly/errors";

import { userMongodbDao } from "../../clients";
import { UserModel, userFactory } from "../../model";
import { getListByQuery } from "../../queries";
import { CREATE_USER_VALIDATION_SCHEMA, PASSWORD_VALIDATION_SCHEMA } from "./constants";
import { CreateDbUserCommand } from "./types";

const validatePassword = validatorFactory(PASSWORD_VALIDATION_SCHEMA);
const createDbUser = createDb<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: CREATE_USER_VALIDATION_SCHEMA,
});

const hasValidPassword = async (data: CreateDbUserCommand): Promise<void> => {
  const { success, error } = await validatePassword(data);
  if (!success) {
    throw error;
  }
};

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const isEmailAlreadyExists = async (email: string): Promise<void> => {
  const users = await getListByQuery({ email });

  if (users.data.length > 0) {
    throw new WrongParamError("Email already exists");
  }
};

export const create = async ({ password, confirmPassword, ...data }: CreateDbUserCommand): Promise<ReturnType<typeof createDbUser>> => {
  await isEmailAlreadyExists(data.email);
  await hasValidPassword({ password, confirmPassword, ...data });
  const passwordHash = await hashPassword(password);
  const user = await createDbUser({ ...data, passwordHash });
  return user;
};