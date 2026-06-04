import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { taskFactory } from '../../model';
import type { TaskModel } from '../../model';
import { buildTaskSearchFilter } from '../shared/buildTaskSearchFilter';
import { resolvePageSize } from '../shared/pagination';

import type { ListUserTasksQueryInput, ListUserTasksQueryResult } from './types';

export type { ListUserTasksQueryInput, ListUserTasksQueryResult } from './types';

const QUERY_INPUT_SCHEMA = z.object({
  userId: z.string().min(1),
  page: z.number().int().min(0),
  size: z.number().int().min(1),
  search: z.string().optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

interface BuildFilterParams {
  userId: string;
  search?: string;
}

const buildFilter = ({ userId, search }: BuildFilterParams): Record<string, unknown> => {
  const conditions: object[] = [{ userId }];
  const searchFilter = buildTaskSearchFilter({ search });

  if (searchFilter !== undefined) {
    conditions.push(searchFilter);
  }

  return { $and: conditions };
};

export const listUserTasks = async (
  input: ListUserTasksQueryInput,
): Promise<ListUserTasksQueryResult> => {
  const parsed = validateQueryInput(input);

  if (!parsed.success) {
    throw parsed.error;
  }

  const cappedSize = resolvePageSize({ size: parsed.data.size });
  const filter = buildFilter({
    userId: parsed.data.userId,
    search: parsed.data.search,
  });
  const skip = parsed.data.page * cappedSize;

  const [rows, totalCount] = await Promise.all([
    taskMongodbDao.getManyRaw(filter, {
      sort: { createdAt: -1 },
      offset: skip,
      limit: cappedSize,
    }),
    taskMongodbDao.collection.countDocuments(filter),
  ]);

  const items = taskFactory.createMany(rows);

  return {
    items,
    totalCount,
    page: parsed.data.page,
    size: cappedSize,
  };
};
