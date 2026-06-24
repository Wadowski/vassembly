import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory } from '../../model';
import type { SystemAgentModel } from '../../model';

import type { GetBySpecializationIdParams, GetBySpecializationIdResult } from './types';

const QUERY_INPUT_SCHEMA = z.object({
  specializationId: z.string().min(1).max(100),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

export const getBySpecializationId = async (
  input: GetBySpecializationIdParams,
): Promise<GetBySpecializationIdResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const filter = {
    specializationId: parsed.data.specializationId,
  };

  const rows = await systemAgentMongodbDao.getManyRaw(filter, {
    sort: { name: 1 },
  });

  const items = rows.map((row) => systemAgentFactory.create(row as Partial<SystemAgentModel>));

  return { items };
};
