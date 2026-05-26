import { validatorFactory } from '@vassembly/validation';

import { userSystemAgentPreferenceMongodbDao } from '../../clients';
import { userSystemAgentPreferenceFactory } from '../../model';

import { assertValidInput } from '../shared/assertValidInput';
import { UPSERT_PREFERENCE_SCHEMA } from '../shared/schemas';

import type { UpsertPreferenceParams, UpsertPreferenceResult } from './types';

const validateUpsertPreference = validatorFactory(UPSERT_PREFERENCE_SCHEMA);

const isUpsertPreferenceResult = (value: unknown): value is UpsertPreferenceResult => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    typeof (value as UpsertPreferenceResult).data.userId === 'string'
  );
};

export const upsertPreference = async (
  input: UpsertPreferenceParams,
): Promise<UpsertPreferenceResult> => {
  const validated = assertValidInput(validateUpsertPreference(input));
  const where = userSystemAgentPreferenceFactory.create({ userId: validated.userId });
  const data = userSystemAgentPreferenceFactory.create({
    userId: validated.userId,
    integrationCredentialId: validated.integrationCredentialId,
  });

  const upsertResult = await userSystemAgentPreferenceMongodbDao.upsert(where, data);

  if (isUpsertPreferenceResult(upsertResult)) {
    return upsertResult;
  }

  const stored = await userSystemAgentPreferenceMongodbDao.get(where);

  return {
    data: userSystemAgentPreferenceFactory.create(stored),
  };
};
