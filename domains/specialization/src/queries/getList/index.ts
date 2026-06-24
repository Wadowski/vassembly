import { specializationMongodbDao } from '../../clients';
import { specializationFactory, toSpecializationResponse } from '../../model';
import type { SpecializationModel } from '../../model';
import { buildNameSearchFilter } from '../shared/buildNameSearchFilter';
import { resolvePagination } from '../shared/pagination';

import type { BuildListFilterParams, GetListParams, GetListResult } from './types';

export type { GetListParams, GetListResult } from './types';

const buildFilter = ({ search }: BuildListFilterParams): Record<string, unknown> => {
  const searchFilter = buildNameSearchFilter({ search });

  if (searchFilter === undefined) {
    return {};
  }

  return searchFilter;
};

export const getList = async (input: GetListParams): Promise<GetListResult> => {
  const { page, size, skip } = resolvePagination({
    page: input.page,
    size: input.size,
  });
  const filter = buildFilter({
    search: input.search,
  });

  const [rows, total] = await Promise.all([
    specializationMongodbDao.getManyRaw(filter, {
      sort: { name: 1 },
      offset: skip,
      limit: size,
    }),
    specializationMongodbDao.collection.countDocuments(filter),
  ]);

  const items = rows.map((row) =>
    toSpecializationResponse({
      specialization: specializationFactory.create(row as Partial<SpecializationModel>),
    }),
  );

  return { items, total, page, size };
};
