import { NotFoundError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { SPECIALIZATION_NAME_MIN_LENGTH } from '../../constants';
import { specializationMongodbDao } from '../../clients';
import { specializationFactory } from '../../model';

import type { SpecializationModel } from '../../model';
import type { GetModelByNameParams, GetModelByNameResult } from './types';

const QUERY_INPUT_SCHEMA = z.object({
  name: z.string().trim().min(SPECIALIZATION_NAME_MIN_LENGTH),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const normalizeName = (name: string): string => name.trim().toLowerCase();

export type { GetModelByNameParams, GetModelByNameResult } from './types';

export const getModelByName = async ({
  name,
}: GetModelByNameParams): Promise<GetModelByNameResult> => {
  const parsed = validateQueryInput({ name });

  if (!parsed.success) {
    throw parsed.error;
  }

  const row = await specializationMongodbDao.getRaw({ name: normalizeName(parsed.data.name) });

  if (!row) {
    throw new NotFoundError(`Specialization not found: ${parsed.data.name}`);
  }

  return {
    data: specializationFactory.create(row as Partial<SpecializationModel>),
  };
};
