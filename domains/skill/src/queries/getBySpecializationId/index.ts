import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { skillMongodbDao } from '../../clients';
import { skillFactory } from '../../model';
import type { SkillModel } from '../../model';
import { buildNameDescriptionSearchFilter } from '../shared/buildNameDescriptionSearchFilter';
import { resolvePagination } from '../shared/pagination';

import type {
  BuildBySpecializationIdFilterParams,
  GetBySpecializationIdParams,
  GetBySpecializationIdResult,
} from './types';

const QUERY_INPUT_SCHEMA = z.object({
  specializationId: z.string().min(1).max(100),
  search: z.string().optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const buildFilter = ({
  specializationId,
  search,
}: BuildBySpecializationIdFilterParams): Record<string, unknown> => {
  const conditions: Record<string, unknown>[] = [{ specializationId }];

  const searchFilter = buildNameDescriptionSearchFilter({ search });
  if (searchFilter !== undefined) {
    conditions.push(searchFilter);
  }

  return { $and: conditions };
};

export const getBySpecializationId = async (
  input: GetBySpecializationIdParams,
): Promise<GetBySpecializationIdResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { page, size, skip } = resolvePagination({
    page: parsed.data.page,
    size: parsed.data.size,
  });
  const filter = buildFilter({
    specializationId: parsed.data.specializationId,
    search: parsed.data.search,
  });

  const [rows, totalCount] = await Promise.all([
    skillMongodbDao.getManyRaw(filter, {
      sort: { name: 1 },
      offset: skip,
      limit: size,
    }),
    skillMongodbDao.collection.countDocuments(filter),
  ]);

  const items = rows.map((row) => skillFactory.create(row as Partial<SkillModel>));

  return { items, totalCount, page, size };
};

export type { GetBySpecializationIdParams, GetBySpecializationIdResult } from './types';
