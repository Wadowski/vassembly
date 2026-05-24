import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import { aiIntegrationMongodbDao } from '../../clients';
import { aiIntegrationCredentialFactory } from '../../model';
import type { AiIntegrationCredentialModel } from '../../model';

import {
  AI_INTEGRATION_LIST_ALL_STATUSES,
  BuildFilterParams,
  type AiIntegrationListStatusFilter,
  type GetListForUserQueryInput,
  type GetListForUserQueryResult,
} from './types';

const MAX_PAGE_SIZE = 50;

const STATUS_FILTER_VALUES = [
  ...Object.values(AiIntegrationStatus),
  AI_INTEGRATION_LIST_ALL_STATUSES,
] as unknown as [AiIntegrationListStatusFilter, ...AiIntegrationListStatusFilter[]];

const PROVIDER_FILTER_VALUES = Object.values(AiIntegrationProvider) as [string, ...string[]];

const QUERY_INPUT_SCHEMA = z.object({
  userId: z.string().min(1),
  page: z.number().int().min(0),
  size: z.number().int().min(1),
  search: z.string().optional(),
  status: z.enum(STATUS_FILTER_VALUES).optional(),
  provider: z.enum(PROVIDER_FILTER_VALUES).optional(),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (params: BuildFilterParams): Record<string, unknown> => {
  const conditions: object[] = [{ userId: params.userId }];
  if (params.status) {
    conditions.push({ status: params.status });
  }
  if (params.provider !== undefined) {
    conditions.push({ provider: params.provider });
  }
  if (params.search !== undefined && params.search.trim() !== '') {
    const term = escapeRegex(params.search.trim());
    conditions.push({ name: { $regex: term, $options: 'i' } });
  }
  return { $and: conditions };
};

export const getListForUser = async (input: GetListForUserQueryInput): Promise<GetListForUserQueryResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const cappedSize = Math.min(parsed.data.size, MAX_PAGE_SIZE);
  const status = parsed.data.status ?? AiIntegrationStatus.Active;
  const filter = buildFilter({
    userId: parsed.data.userId,
    search: parsed.data.search,
    status,
    provider: parsed.data.provider,
  });
  const skip = parsed.data.page * cappedSize;

  const [rows, totalCount] = await Promise.all([
    aiIntegrationMongodbDao.getManyRaw(filter, {
      sort: { createdAt: -1 },
      offset: skip,
      limit: cappedSize,
    }),
    aiIntegrationMongodbDao.collection.countDocuments(filter),
  ]);
  const items = rows.map((row) => aiIntegrationCredentialFactory.create(row as Partial<AiIntegrationCredentialModel>));

  return { items, totalCount, page: parsed.data.page, size: cappedSize };
};
