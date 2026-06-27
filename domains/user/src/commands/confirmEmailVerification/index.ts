import { encode } from '@vassembly/client-encoder';
import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { userMongodbDao } from '../../clients';
import { userFactory } from '../../model/factories';
import { USER_ID_VALIDATION_SCHEMA } from '../userIdValidationSchema';
import type { ConfirmEmailVerificationCommand } from './types';

const INVALID_TOKEN_MESSAGE = 'Invalid or expired verification link';

export const confirmEmailVerification = async ({
  userId,
  token,
}: ConfirmEmailVerificationCommand): Promise<void> => {
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

  if (!userRecord.emailVerificationToken) {
    throw new WrongParamError(INVALID_TOKEN_MESSAGE);
  }

  if (
    !userRecord.emailVerificationExpiresAt ||
    userRecord.emailVerificationExpiresAt <= new Date()
  ) {
    throw new WrongParamError(INVALID_TOKEN_MESSAGE);
  }

  const encodedToken = encode(token);
  if (encodedToken !== userRecord.emailVerificationToken) {
    throw new WrongParamError(INVALID_TOKEN_MESSAGE);
  }

  await userMongodbDao.update(
    queryInstance,
    userFactory.create({
      verifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      emailVerificationIssuedAt: null,
    }),
  );
};
