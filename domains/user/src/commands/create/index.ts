import { hash } from '@vassembly/client-encoder';
import { createDb } from '@vassembly/commands';
import { InternalError, WrongParamError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

import { userMongodbDao } from '../../clients';
import { UserModel, toUserPublicResponse, userFactory } from '../../model';
import { getByEmail } from '../../queries';
import { CREATE_USER_VALIDATION_SCHEMA, PASSWORD_VALIDATION_SCHEMA } from './constants';
import type { CreateDbUserCommand, CreateUserCommandResult } from './types';
import { AUTH_TOKEN_ROLE } from '@vassembly/constants';

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
    throw new WrongParamError('Email already exists');
  }
};

export const create = async ({
  password,
  ...data
}: CreateDbUserCommand): Promise<CreateUserCommandResult> => {
  await isEmailAlreadyExists(data.email);
  await hasValidPassword({ password, ...data });
  const passwordHash = await hash({ text: password });
  const user = await createDbUser({ ...data, passwordHash, role: AUTH_TOKEN_ROLE.USER });
  if (!user.data) {
    throw new InternalError('User creation returned no data');
  }
  return { data: toUserPublicResponse({ user: user.data }) };
};
