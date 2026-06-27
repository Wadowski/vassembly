import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { skillMongodbDao } from '../../clients';

import type {
  GetCatalogBySpecializationIdParams,
  GetCatalogBySpecializationIdResult,
  SkillCatalogItem,
} from './types';

const QUERY_INPUT_SCHEMA = z.object({
  specializationId: z.string().min(1).max(100),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

export const getCatalogBySpecializationId = async (
  input: GetCatalogBySpecializationIdParams,
): Promise<GetCatalogBySpecializationIdResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const rows = await skillMongodbDao.getManyRaw(
    {
      specializationId: parsed.data.specializationId,
      enabled: true,
      $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
    },
    { sort: { name: 1 } },
  );

  const items: SkillCatalogItem[] = rows.map((row) => ({
    name: String(row.name),
    description: String(row.description),
  }));

  return { items };
};

export type {
  GetCatalogBySpecializationIdParams,
  GetCatalogBySpecializationIdResult,
  SkillCatalogItem,
} from './types';
