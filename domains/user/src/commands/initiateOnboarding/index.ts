import { NotFoundError } from '@vassembly/errors';

import { userMongodbDao } from '../../clients';
import { userFactory } from '../../model/factories';
import { USER_ID_VALIDATION_SCHEMA } from '../userIdValidationSchema';
import type { InitiateOnboardingCommand } from './types';

const ONBOARDING_VERSION = 1;

export const initiateOnboarding = async ({
  userId,
}: InitiateOnboardingCommand): Promise<void> => {
  const queryInstance = userFactory.create(
    { id: userId },
    { validationSchema: USER_ID_VALIDATION_SCHEMA },
  );
  queryInstance.isValid({ shouldThrow: true });

  const existing = await userMongodbDao.get(queryInstance);
  if (!existing) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const userRecord = userFactory.create(existing);
  if (userRecord.removedAt) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  if (userRecord.onboarding?.startedAt != null) {
    return;
  }

  await userMongodbDao.update(
    queryInstance,
    userFactory.create({
      onboarding: {
        version: ONBOARDING_VERSION,
        startedAt: new Date(),
        completedAt: null,
      },
    }),
  );
};
