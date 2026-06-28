import { encode } from '@vassembly/client-encoder';
import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { userMongodbDao } from '../../clients';
import { userFactory } from '../../model/factories';
import { USER_ID_VALIDATION_SCHEMA } from '../userIdValidationSchema';
import { EMAIL_VERIFICATION_TOKEN_TTL_MS } from './constants';
import type { RequestEmailVerificationCommand } from './types';

export const requestEmailVerification = async ({
  userId,
  token,
}: RequestEmailVerificationCommand): Promise<void> => {
  const queryInstance = userFactory.create(
    { id: userId },
    { validationSchema: USER_ID_VALIDATION_SCHEMA },
  );
  queryInstance.isValid({ shouldThrow: true });

  if (!token) {
    throw new WrongParamError('Verification token is required');
  }

  const existing = await userMongodbDao.get(queryInstance);
  if (!existing) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const userRecord = userFactory.create(existing);
  if (userRecord.removedAt) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const now = new Date();

  await userMongodbDao.update(
    queryInstance,
    userFactory.create({
      emailVerificationToken: encode(token),
      emailVerificationExpiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
      emailVerificationIssuedAt: now,
    }),
  );
};
