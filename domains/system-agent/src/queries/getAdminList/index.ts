import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { AgentStatus } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory, toSystemAgentResponse } from '../../model';
import type { SystemAgentModel } from '../../model';
import { buildNameDescriptionSearchFilter } from '../shared/buildNameDescriptionSearchFilter';
import { resolvePagination } from '../shared/pagination';

import type { BuildAdminListFilterParams, GetAdminListParams, GetAdminListResult } from './types';

const STATUS_FILTER_VALUES = Object.values(AgentStatus) as [AgentStatus, ...AgentStatus[]];

const QUERY_INPUT_SCHEMA = z.object({
  status: z.enum(STATUS_FILTER_VALUES).optional(),
  search: z.string().optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const buildFilter = ({ status, search }: BuildAdminListFilterParams): Record<string, unknown> => {
  const conditions: Record<string, unknown>[] = [];

  if (status !== undefined) {
    conditions.push({ status });
  }

  const searchFilter = buildNameDescriptionSearchFilter({ search });
  if (searchFilter !== undefined) {
    conditions.push(searchFilter);
  }

  if (conditions.length === 0) {
    return {};
  }

  return { $and: conditions };
};

export const getAdminList = async (input: GetAdminListParams): Promise<GetAdminListResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { page, size, skip } = resolvePagination({
    page: parsed.data.page,
    size: parsed.data.size,
  });
  const filter = buildFilter({
    status: parsed.data.status,
    search: parsed.data.search,
  });

  const [rows, totalCount] = await Promise.all([
    systemAgentMongodbDao.getManyRaw(filter, {
      sort: { updatedAt: -1 },
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
