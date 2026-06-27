import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { userMongodbDao } from '../../clients';
import { userFactory } from '../../model/factories';
import { USER_ID_VALIDATION_SCHEMA } from '../userIdValidationSchema';
import type { CompleteOnboardingCommand } from './types';

export const completeOnboarding = async ({
  userId,
}: CompleteOnboardingCommand): Promise<void> => {
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

  if (userRecord.onboarding == null) {
    throw new WrongParamError('Onboarding was never initiated');
  }

  if (userRecord.onboarding.completedAt != null) {
    return;
  }

  await userMongodbDao.update(
    queryInstance,
    userFactory.create({
      onboarding: {
        ...userRecord.onboarding,
        completedAt: new Date(),
      },
    }),
  );
};
