import { removeSoftDb } from '@vassembly/commands';
import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { skillMongodbDao } from '../../clients';
import { SkillModel, skillFactory } from '../../model';
import { getModelById } from '../../queries/getModelById';

import type { RemoveSoftParams, RemoveSoftResult } from './types';

const NOT_FOUND_MESSAGE = 'Skill not found';
const ALREADY_ARCHIVED_MESSAGE = 'Archive requires active skill';

export const removeSoft = async (input: RemoveSoftParams): Promise<RemoveSoftResult> => {
  const existing = await getModelById({ id: input.id });

  if (existing.data.removedAt != null) {
    throw new WrongParamError(ALREADY_ARCHIVED_MESSAGE);
  }

  const persistRemoveSoft = removeSoftDb<SkillModel>({
    dao: skillMongodbDao,
    factory: skillFactory,
  });

  try {
    return await persistRemoveSoft({ id: input.id });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError(NOT_FOUND_MESSAGE);
    }

    throw error;
  }
};
