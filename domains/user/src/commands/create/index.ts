import { hash } from "@vassembly/client-encoder";
import { createDb } from "@vassembly/commands";
import { validatorFactory } from "@vassembly/validation";
import { InternalError, WrongParamError } from "@vassembly/errors";

import { userMongodbDao } from "../../clients";
import { UserModel, userFactory, createUserFactory } from "../../model";
import { getByEmail } from "../../queries";
import { CREATE_USER_VALIDATION_SCHEMA, PASSWORD_VALIDATION_SCHEMA } from "./constants";
import type { CreateDbUserCommand, CreateUserCommandResult } from "./types";

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

const isEmailAlreadyExists = async (email: string): Promise<void> => {
  const user = await getByEmail({ email });

  if (user) {
    throw new WrongParamError("Email already exists");
  }
};

const userPublicFactory = createUserFactory();

export const create = async ({
  password,
  ...data
}: CreateDbUserCommand): Promise<CreateUserCommandResult> => {
  await isEmailAlreadyExists(data.email);
  await hasValidPassword({ password, ...data });
  const passwordHash = await hash({ text: password });
  const user = await createDbUser({ ...data, passwordHash });
  if (!user.data) {
    throw new InternalError("User creation returned no data");
  }
  return { data: userPublicFactory.toPublicResponse(user.data) };
};