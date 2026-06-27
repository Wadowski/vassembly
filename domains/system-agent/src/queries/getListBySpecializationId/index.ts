import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory, toSystemAgentResponse } from '../../model';
import type { SystemAgentModel } from '../../model';
import { buildNameDescriptionSearchFilter } from '../shared/buildNameDescriptionSearchFilter';
import { resolvePagination } from '../shared/pagination';

import type {
  BuildListBySpecializationIdFilterParams,
  GetListBySpecializationIdParams,
  GetListBySpecializationIdResult,
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
}: BuildListBySpecializationIdFilterParams): Record<string, unknown> => {
  const conditions: Record<string, unknown>[] = [{ specializationId }];

  const searchFilter = buildNameDescriptionSearchFilter({ search });
  if (searchFilter !== undefined) {
    conditions.push(searchFilter);
  }

  return { $and: conditions };
};

export const getListBySpecializationId = async (
  input: GetListBySpecializationIdParams,
): Promise<GetListBySpecializationIdResult> => {
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
    systemAgentMongodbDao.getManyRaw(filter, {
      sort: { name: 1 },
      offset: skip,
      limit: size,
    }),
    systemAgentMongodbDao.collection.countDocuments(filter),
  ]);

  const items = rows.map((row) =>
    toSystemAgentResponse({
      systemAgent: systemAgentFactory.create(row as Partial<SystemAgentModel>),
    }),
  );

  return { items, totalCount, page, size };
};
