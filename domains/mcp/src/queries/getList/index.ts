import { mcpMongodbDao } from '../../clients';
import { mcpFactory, toMcpResponse } from '../../model';
import type { McpModel } from '../../model';
import { buildNameDescriptionSearchFilter } from '../shared/buildNameDescriptionSearchFilter';
import { buildTagsFilter } from '../shared/buildTagsFilter';
import { resolvePagination } from '../shared/pagination';

import type { BuildListFilterParams, GetListParams, GetListResult } from './types';

const buildFilter = ({ search, tags }: BuildListFilterParams): Record<string, unknown> => {
  const conditions: Record<string, unknown>[] = [];

  const searchFilter = buildNameDescriptionSearchFilter({ search });
  if (searchFilter !== undefined) {
    conditions.push(searchFilter);
  }

  const tagsFilter = buildTagsFilter({ tags });
  if (tagsFilter !== undefined) {
    conditions.push(tagsFilter);
  }

  if (conditions.length === 0) {
    return {};
  }

  return { $and: conditions };
};

export const getList = async (input: GetListParams): Promise<GetListResult> => {
  const { page, size, skip } = resolvePagination({
    page: input.page,
    size: input.size,
  });
  const filter = buildFilter({
    search: input.search,
    tags: input.tags,
  });

  const [rows, total] = await Promise.all([
    mcpMongodbDao.getManyRaw(filter, {
      sort: { name: 1 },
      offset: skip,
      limit: size,
    }),
    mcpMongodbDao.collection.countDocuments(filter),
  ]);

  const items = rows.map((row) =>
    toMcpResponse({
      mcp: mcpFactory.create(row as Partial<McpModel>),
    }),
  );

  return { items, total, page, size };
};
