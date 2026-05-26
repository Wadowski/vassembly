import { compareHash, hash } from '@vassembly/client-encoder';
import { validatorFactory } from '@vassembly/validation';
import { UnauthorizedError, ValidationError, WrongParamError } from '@vassembly/errors';

import { userMongodbDao } from '../../clients';
import { UserModel, userFactory } from '../../model';
import { getModelById } from '../../queries/getModelById';
import { PASSWORD_VALIDATION_SCHEMA } from '../create/constants';
import { USER_ID_VALIDATION_SCHEMA } from '../userIdValidationSchema';
import { CHANGE_PASSWORD_INPUT_SCHEMA } from './constants';
import type { ChangePasswordCommand } from './types';

const validateChangePasswordInput = validatorFactory(CHANGE_PASSWORD_INPUT_SCHEMA);
const validatePasswordPolicy = validatorFactory(PASSWORD_VALIDATION_SCHEMA);

export const changePassword = async (
  rawInput: ChangePasswordCommand,
): Promise<{ data: UserModel }> => {
  const parsed = validateChangePasswordInput(rawInput);
  if (!parsed.success) {
    throw parsed.error;
  }
  const { userId, currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    throw new WrongParamError('New password must differ from the current password');
  }

  const policy = validatePasswordPolicy({ password: newPassword });
  if (!policy.success) {
    throw new ValidationError(policy.error.message, policy.error);
  }

  const existing = await getModelById({ id: userId });
  if (!existing.data?.passwordHash) {
    throw new UnauthorizedError('Password change is not available for this account', { userId });
  }

  const isCurrentValid = await compareHash({
    text: currentPassword,
    hash: existing.data.passwordHash,
  });
  if (!isCurrentValid) {
    throw new UnauthorizedError('Current password is incorrect', { userId });
  }

  const queryInstance = userFactory.create({ id: userId }, { validationSchema: USER_ID_VALIDATION_SCHEMA });
  queryInstance.isValid({ shouldThrow: true });

  const passwordHash = await hash({ text: newPassword });

  await userMongodbDao.update(
    queryInstance,
    userFactory.create({ passwordHash }),
  );

  const refreshed = await getModelById({ id: userId });
  return refreshed;
};

export type { ChangePasswordCommand } from './types';
