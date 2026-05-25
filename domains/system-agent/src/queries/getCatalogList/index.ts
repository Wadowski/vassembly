import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { AgentCategory } from '../../constants';
import { systemAgentMongodbDao } from '../../clients';
import { systemAgentFactory, toCatalogListItem } from '../../model';
import type { SystemAgentModel } from '../../model';
import { ACTIVE_SYSTEM_AGENT_FILTER } from '../shared/activeSystemAgentFilter';
import { buildNameDescriptionSearchFilter } from '../shared/buildNameDescriptionSearchFilter';
import { resolvePagination } from '../shared/pagination';

import type { BuildCatalogListFilterParams, GetCatalogListParams, GetCatalogListResult } from './types';

const CATEGORY_FILTER_VALUES = Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]];

const QUERY_INPUT_SCHEMA = z.object({
  search: z.string().optional(),
  category: z.enum(CATEGORY_FILTER_VALUES).optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const buildFilter = ({
  search,
  category,
}: BuildCatalogListFilterParams): Record<string, unknown> => {
  const conditions: Record<string, unknown>[] = [{ ...ACTIVE_SYSTEM_AGENT_FILTER }];

  if (category !== undefined) {
    conditions.push({ category });
  }

  const searchFilter = buildNameDescriptionSearchFilter({ search });
  if (searchFilter !== undefined) {
    conditions.push(searchFilter);
  }

  return { $and: conditions };
};

export const getCatalogList = async (input: GetCatalogListParams): Promise<GetCatalogListResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { page, size, skip } = resolvePagination({
    page: parsed.data.page,
    size: parsed.data.size,
  });
  const filter = buildFilter({
    search: parsed.data.search,
    category: parsed.data.category,
  });

  const [rows, totalCount] = await Promise.all([
    systemAgentMongodbDao.getManyRaw(filter, {
      sort: { name: 1 },
      offset: skip,
      limit: size,
    }),
    systemAgentMongodbDao.collection.countDocuments(filter),
  ]);

  const items = rows.map((row) => {
    const systemAgent = systemAgentFactory.create(row as Partial<SystemAgentModel>);

    return {
      ...toCatalogListItem({ systemAgent }),
      removedAt: null,
    };
  });

  return { items, totalCount, page, size };
};
