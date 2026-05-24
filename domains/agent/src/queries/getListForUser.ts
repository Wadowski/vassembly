import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { agentMongodbDao } from '../clients';
import { AgentStatus, agentFactory } from '../model';
import type { AgentModel } from '../model';

import {
  AGENT_LIST_ALL_STATUSES,
  type AgentListStatusFilter,
  type GetListForUserQueryInput,
  type GetListForUserQueryResult,
} from './getListForUser.types';

export type { AgentListStatusFilter, GetListForUserQueryInput, GetListForUserQueryResult } from './getListForUser.types';
export { AGENT_LIST_ALL_STATUSES } from './getListForUser.types';

const MAX_PAGE_SIZE = 50;

const STATUS_FILTER_VALUES = [...Object.values(AgentStatus), AGENT_LIST_ALL_STATUSES] as unknown as [
  AgentListStatusFilter,
  ...AgentListStatusFilter[],
];

const QUERY_INPUT_SCHEMA = z.object({
  userId: z.string().min(1),
  page: z.number().int().min(0),
  size: z.number().int().min(1),
  search: z.string().optional(),
  status: z.enum(STATUS_FILTER_VALUES).optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface BuildFilterParams {
  userId: string;
  search?: string;
  status: AgentListStatusFilter;
}

const buildFilter = (params: BuildFilterParams): Record<string, unknown> => {
  const conditions: object[] = [{ userId: params.userId }];
  if (params.status === AgentStatus.Active) {
    conditions.push({ status: AgentStatus.Active });
    conditions.push({ $or: [{ removedAt: null }, { removedAt: { $exists: false } }] });
  } else if (params.status === AgentStatus.Disabled) {
    conditions.push({ status: AgentStatus.Disabled });
    conditions.push({ $or: [{ removedAt: null }, { removedAt: { $exists: false } }] });
  } else if (params.status === AgentStatus.Archived) {
    conditions.push({ status: AgentStatus.Archived });
  }
  if (params.search !== undefined && params.search.trim() !== '') {
    const term = escapeRegex(params.search.trim());
    conditions.push({
      $or: [{ name: { $regex: term, $options: 'i' } }, { description: { $regex: term, $options: 'i' } }],
    });
  }
  return { $and: conditions };
};

export const getListForUser = async (input: GetListForUserQueryInput): Promise<GetListForUserQueryResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const cappedSize = Math.min(parsed.data.size, MAX_PAGE_SIZE);
  const status = parsed.data.status ?? AgentStatus.Active;
  const filter = buildFilter({
    userId: parsed.data.userId,
    search: parsed.data.search,
    status,
  });
  const skip = parsed.data.page * cappedSize;

  const [rows, totalCount] = await Promise.all([
    agentMongodbDao.getManyRaw(filter, {
      sort: { createdAt: -1 },
      offset: skip,
      limit: cappedSize,
    }),
    agentMongodbDao.collection.countDocuments(filter),
  ]);
  const items = rows.map((row) => agentFactory.create(row as Partial<AgentModel>));

  return { items, totalCount, page: parsed.data.page, size: cappedSize };
};
